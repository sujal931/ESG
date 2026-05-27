# ESG Data Platform: Production Deployment Guide

This guide details the steps required to deploy the **ESG Data Ingestion & Analyst Review Platform** to a production environment. Since the platform consists of a Django (DRF) backend, a React (Vite) frontend, and a PostgreSQL database, multiple deployment strategies are supported depending on your scale and infrastructure requirements.

---

## 🏗️ Deployment Architecture Overview

```mermaid
graph TD
    User([User Browser]) -->|HTTPS| Proxy[Nginx / Cloudflare CDN]
    Proxy -->|Static Content| Frontend[Vite React App served via Nginx]
    Proxy -->|API Requests /api/*| Backend[Django DRF Application]
    Backend -->|Database Queries| DB[(PostgreSQL Database)]
    Backend -->|Persistent Storage| Volumes[Docker Volumes / AWS S3]
```

Select the deployment strategy that best fits your needs:
1. **[Strategy A: Single-Server Docker Compose (Recommended)](#-strategy-a-single-server-docker-compose-recommended)** — Best for VPS (DigitalOcean, AWS EC2, Linode, Hetzner). Easiest to maintain and cost-effective.
2. **[Strategy B: Managed PaaS (Render / Railway)](#-strategy-b-managed-paas-render--railway)** — Best for fast, zero-ops deployments. Highly managed, handles SSL/DNS automatically.
3. **[Strategy C: Serverless / Cloud Containers (AWS ECS / GCP Cloud Run)](#-strategy-c-serverless--cloud-containers-aws-ecs--gcp-cloud-run)** — Best for high-availability, scalability, and enterprise-grade environments.

---

## 🔒 Production Security Checklist

Before deploying, ensure you configure these critical settings in your backend `.env` file:

| Environment Variable | Production Value | Description |
| :--- | :--- | :--- |
| `DEBUG` | `False` | Disables verbose Django error pages. **CRITICAL!** |
| `SECRET_KEY` | *[Generate a 50+ character random string]* | Cryptographic signing key. |
| `ALLOWED_HOSTS` | `yourdomain.com,api.yourdomain.com` | Restricts Django to responding only to recognized hostnames. |
| `CORS_ALLOWED_ORIGINS` | `https://yourdomain.com` | Restricts API requests to only originate from your frontend domain. |
| `DB_PASSWORD` | *[Strong random password]* | Keeps your PostgreSQL server secure. |

> [!WARNING]
> Never commit actual production `.env` files to git repositories. Always add `.env` to `.gitignore` and inject variables using secure environment managers or secrets managers.

---

## 🐳 Strategy A: Single-Server Docker Compose (Recommended)

This strategy deploys the entire application stack onto a single virtual private server (VPS). It uses **Docker Compose** to run containers, **Nginx** as a reverse proxy, and **Certbot (Let's Encrypt)** for automated SSL certificates.

### 1. Host Server Prerequisites
Create a VM instance (e.g., DigitalOcean Droplet, AWS EC2 t3.medium, Linode) running Ubuntu 22.04 LTS or 24.04 LTS. Ensure port `80` (HTTP) and `443` (HTTPS) are open in your firewall.

Connect to your server and install Docker:
```bash
# Update package list and install prerequisites
sudo apt update && sudo apt install -y curl git apt-transport-https ca-certificates curl software-properties-common

# Install Docker & Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
newgrp docker
```

### 2. Configure Environment Variables
On the server, create a secure directory structure and write a production `.env` file inside the `backend` folder:

```bash
mkdir -p ~/esg-platform && cd ~/esg-platform
git clone <your-repository-url> .
```

Create `backend/.env`:
```ini
SECRET_KEY=y0ur-5uper-5ecret-random-p4ssword-string-here-make-it-long
DEBUG=False
DB_NAME=esg_platform
DB_USER=esg_admin
DB_PASSWORD=secure_postgres_password_xyz123
DB_HOST=db
DB_PORT=5432
ALLOWED_HOSTS=api.yourdomain.com,localhost,backend
CORS_ALLOWED_ORIGINS=https://yourdomain.com
```

### 3. Production Docker Compose Configuration
Create a production docker-compose file `docker-compose.prod.yml` in the root folder:

```yaml
version: "3.9"

services:
  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: esg_platform
      POSTGRES_USER: esg_admin
      POSTGRES_PASSWORD: secure_postgres_password_xyz123
    ports:
      - "127.0.0.1:5432:5432" # Keep database local only, never expose to public web
    volumes:
      - pgdata:/var/lib/postgresql/data
    restart: always

  backend:
    build: ./backend
    environment:
      - SECRET_KEY=y0ur-5uper-5ecret-random-p4ssword-string-here-make-it-long
      - DEBUG=False
      - DB_NAME=esg_platform
      - DB_USER=esg_admin
      - DB_PASSWORD=secure_postgres_password_xyz123
      - DB_HOST=db
      - DB_PORT=5432
      - ALLOWED_HOSTS=api.yourdomain.com,localhost,backend
      - CORS_ALLOWED_ORIGINS=https://yourdomain.com
    depends_on:
      - db
    command: >
      sh -c "python manage.py migrate &&
             python manage.py seed_demo &&
             gunicorn config.wsgi:application --bind 0.0.0.0:8000 --workers 3"
    restart: always

  frontend:
    build: ./frontend
    ports:
      - "8080:80" # Exposed to local Nginx reverse proxy
    depends_on:
      - backend
    restart: always

volumes:
  pgdata:
```

Launch the stack:
```bash
docker compose -f docker-compose.prod.yml up -d --build
```

### 4. Setting up Nginx & SSL on the Host Machine
To route requests securely from the public internet (HTTP/HTTPS) into the Docker containers, install Nginx and Certbot directly on the host machine:

```bash
sudo apt install -y nginx certbot python3-certbot-nginx
```

Configure Nginx to route traffic to the frontend and backend containers. Create a virtual host file at `/etc/nginx/sites-available/esg-platform`:

```nginx
server {
    listen 80;
    server_name yourdomain.com api.yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:8080; # Directs to React frontend container
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable the configuration and reload Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/esg-platform /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

Obtain SSL certificates automatically using Let's Encrypt:
```bash
sudo certbot --nginx -d yourdomain.com -d api.yourdomain.com
```
Certbot will configure SSL redirects, updating the Nginx configuration automatically.

---

## ☁️ Strategy B: Managed PaaS (Render / Railway)

If you prefer not to manage Linux servers, Docker configurations, or reverse proxies, you can deploy using a managed Platform as a Service (PaaS) like **Render** or **Railway**.

```
┌─────────────────────────────────────────────────────────────┐
│                       Render / Railway                      │
│                                                             │
│  ┌──────────────────┐  ┌──────────────────┐  ┌───────────┐  │
│  │ React Frontend   │  │ Django Backend   │  │ Managed   │  │
│  │ (Static Site)    │  │ (Web Service)    │  │ Postgres  │  │
│  └────────┬─────────┘  └────────┬─────────┘  └─────┬─────┘  │
│           │                     │                  │        │
│           └────── HTTPS ────────┴────── TCP ───────┘        │
└─────────────────────────────────────────────────────────────┘
```

### 1. Step 1: Spin up Managed PostgreSQL
Create a PostgreSQL database instance on Render/Railway.
- Save the **Internal Database URL** (e.g., `postgresql://esg_admin:pwd@host-internal:5432/esg_platform`) for backend connections.
- Save the **External Database URL** (for administrative CLI actions if necessary).

### 2. Step 2: Deploy Django Backend (Web Service)
Create a new **Web Service** on Render and connect it to your GitHub repository.
- **Root Directory**: `backend`
- **Runtime**: `Python`
- **Build Command**: `pip install -r requirements.txt && python manage.py collectstatic --noinput`
- **Start Command**: `gunicorn config.wsgi:application --bind 0.0.0.0:10000 --workers 3`
- **Environment Variables**:
  - `SECRET_KEY` = *[Generate strong secret]*
  - `DEBUG` = `False`
  - `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT` = *[From your managed DB]*
  - `ALLOWED_HOSTS` = `your-backend-app.onrender.com`
  - `CORS_ALLOWED_ORIGINS` = `https://your-frontend-app.onrender.com`

### 3. Step 3: Deploy React Frontend (Static Site)
Create a new **Static Site** on Render and connect it to your GitHub repository.
- **Root Directory**: `frontend`
- **Build Command**: `npm install && npm run build`
- **Publish Directory**: `dist`
- **Environment Variables**:
  - `VITE_API_URL` = `https://your-backend-app.onrender.com/api` (Ensures API requests target the deployed backend directly)
- **Routing Redirect Rules**:
  - Navigate to **Redirects/Rewrites** and add:
    - **Source**: `/*`
    - **Destination**: `/index.html`
    - **Action**: `Rewrite` (This ensures React Router works correctly on page reloads!)

---

## ⚡ Strategy C: Serverless / Cloud Containers (AWS ECS / GCP Cloud Run)

For large enterprise workloads, serverless container hosting provides excellent security, horizontal auto-scaling, and high reliability.

```mermaid
graph LR
    subgraph VPC
        ECS[AWS ECS / GCP Cloud Run] -->|Private Subnet| RDS[(AWS RDS / GCP Cloud SQL)]
    end
    Browser([Browser]) -->|Route 53 / DNS| ALB[Application Load Balancer]
    ALB -->|Forward HTTPS| ECS
    S3[(AWS S3 / GCP Storage)] -.->|Assets/Media| ECS
```

### 1. Build and Publish Docker Images
Store your docker images in a private registry (AWS ECR or GCP Artifact Registry).

```bash
# Login to AWS ECR (Example)
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <aws_account_id>.dkr.ecr.us-east-1.amazonaws.com

# Build and Push Backend
docker build -t esg-backend ./backend
docker tag esg-backend:latest <aws_account_id>.dkr.ecr.us-east-1.amazonaws.com/esg-backend:latest
docker push <aws_account_id>.dkr.ecr.us-east-1.amazonaws.com/esg-backend:latest

# Build and Push Frontend
docker build -t esg-frontend ./frontend
docker tag esg-frontend:latest <aws_account_id>.dkr.ecr.us-east-1.amazonaws.com/esg-frontend:latest
docker push <aws_account_id>.dkr.ecr.us-east-1.amazonaws.com/esg-frontend:latest
```

### 2. Configure Serverless Infrastructure
1. **Database**: Spin up **AWS RDS PostgreSQL** or **GCP Cloud SQL** within a private subnet.
2. **Secrets Manager**: Store database credentials and Django keys securely in **AWS Secrets Manager** or **GCP Secret Manager**.
3. **Execution Environment**:
   - **Backend Task (AWS Fargate / GCP Cloud Run)**: Run backend containers configured to scale from 1 to N instances automatically based on CPU/Memory load.
   - **Static Assets (WhiteNoise)**: The Django Docker container has `whitenoise` configured (see `settings.py`), meaning Django automatically serves its own static files (like the Admin panel) securely, saving you from setting up separate CDN routes for backend static files.
   - **Frontend Hosting**: Since the frontend docker container packages everything in Nginx (see `frontend/Dockerfile`), you can host the Frontend as an ECS Service behind the Load Balancer, OR deploy the raw `dist` directory straight to **AWS S3 + CloudFront** for near-zero costs and lightning-fast worldwide loads.

---

## 🛠️ Post-Deployment Administration

Once the containers are up and running, you need to run standard Django setup tasks:

### 1. Create a Production Superuser
To log into the Django Admin dashboard and perform user management, database overrides, and rule configurations:

**For Docker Compose:**
```bash
docker compose -f docker-compose.prod.yml exec backend python manage.py createsuperuser
```

**For PaaS (Render / Railway):**
Use the CLI shell tool in their web dashboard or run:
```bash
# In the Render backend shell tab
python manage.py createsuperuser
```

### 2. Seed Initial Demo Data (Optional)
If you want to quickly verify that the production platform is fully operational and populated with initial ESG models, configurations, and review boards:
```bash
python manage.py seed_demo
```

### 3. Verify Database Backups
Always schedule daily database backups. For self-hosted Postgres (Strategy A), you can schedule a cron job:
```bash
# Edit crontab
crontab -e

# Add a cron job to backup the database every night at 2:00 AM
0 2 * * * docker exec -t esg-platform-db-1 pg_dumpall -U esg_admin | gzip > /backups/db_$(date +\%F).sql.gz
```

---

> [!TIP]
> **Recommended Path:** Start with **Strategy A (Docker Compose)** on a $12/month DigitalOcean Droplet. The repository is already pre-configured with fully-tested `Dockerfile` and `docker-compose` assets, making this route immediate, highly reproducible, and very robust.
