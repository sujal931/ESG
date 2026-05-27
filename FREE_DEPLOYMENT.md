# 100% Free Production Deployment Guide: ESG Platform

You can deploy this entire application (Frontend, Backend, and Database) **completely for free** with production-grade uptime, permanent data storage (unlike Render's 90-day free database), and custom domains using modern cloud developer platforms.

---

## 🗺️ Free Stack Architecture

```mermaid
graph TD
    User([User Browser]) -->|HTTPS| Vercel[Vercel CDN - Frontend]
    Vercel -->|Renders UI| User
    User -->|API Requests /api/*| Render[Render.com Free Tier - Django Backend]
    Render -->|Queries| Neon[(Neon.tech - Free Serverless Postgres)]
```

| Component | Service | Free Tier Benefits | Limitations |
| :--- | :--- | :--- | :--- |
| **Database** | **Neon** (`neon.tech`) | 100% Free, Permanent Postgres, 0.5 GiB Storage | Web dashboard scales down when inactive (wakes up instantly upon queries) |
| **Backend** | **Render** (`render.com`) | Free Web Services, Git Auto-Deploy, Free SSL | Spins down after 15 mins of inactivity (first request takes ~50s to wake up) |
| **Frontend** | **Vercel** (`vercel.com`) | Ultra-Fast Global Edge CDN, Permanent SSL, Auto-Deploy | None for personal scale |

---

## 🗄️ Step 1: Set up a Free Postgres Database on Neon

[Neon](https://neon.tech/) offers a serverless PostgreSQL database that is **permanently free** and does not expire.

1. Go to **[neon.tech](https://neon.tech/)** and sign up for a free account.
2. Create a new project (e.g., `esg-platform`).
3. Select database version **PostgreSQL 15** or **16**.
4. In your Neon dashboard, copy your **Connection String**. It will look like this:
   ```text
   postgresql://neondb_owner:npg_xY12AbCdEfGh@ep-cool-breeze-a5z12345.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
5. Since Django expects split variables in `settings.py`, extract your Neon connection details:

   * **`DB_USER`**: `neondb_owner` (the string between `postgresql://` and the first `:`)
   * **`DB_PASSWORD`**: `npg_xY12AbCdEfGh` (the string between `:` and `@`)
   * **`DB_HOST`**: `ep-cool-breeze-a5z12345.us-east-2.aws.neon.tech` (the string between `@` and `/`)
   * **`DB_NAME`**: `neondb` (the string after the `/` and before the `?`)
   * **`DB_PORT`**: `5432`

---

## 🐍 Step 2: Deploy the Django Backend on Render.com

Render allows you to run one web service completely for free.

### 1. Push your repository to GitHub
Make sure your workspace code is pushed to your personal GitHub account (either public or private repository).

### 2. Create the Render Web Service
1. Go to **[dashboard.render.com](https://dashboard.render.com/)** and log in with GitHub.
2. Click **New +** > **Web Service**.
3. Select your repository.
4. Set the following details:
   * **Name**: `esg-backend`
   * **Root Directory**: `backend`
   * **Language/Runtime**: `Python`
   * **Build Command**: `pip install -r requirements.txt && python manage.py collectstatic --noinput`
   * **Start Command**: `gunicorn config.wsgi:application --bind 0.0.0.0:10000 --workers 2`
   * **Instance Type**: Select **Free** ($0/month)

### 3. Add Environment Variables
Click the **Environment** tab on Render and add the following keys:

| Key | Value | Notes |
| :--- | :--- | :--- |
| `DEBUG` | `False` | Disables django debug console |
| `SECRET_KEY` | `your-own-random-50-character-secret` | Generate a unique password string |
| `DB_NAME` | `neondb` | From your Neon Connection String |
| `DB_USER` | `neondb_owner` | From your Neon Connection String |
| `DB_PASSWORD` | `npg_xY12AbCdEfGh` | From your Neon Connection String |
| `DB_HOST` | `ep-cool-breeze-a5z12345.us-east-2.aws.neon.tech` | From your Neon Connection String |
| `DB_PORT` | `5432` | Postgres default port |
| `ALLOWED_HOSTS` | `esg-backend.onrender.com,backend` | Replace with your actual backend URL once created |
| `CORS_ALLOWED_ORIGINS` | `https://esg-frontend.vercel.app` | Replace with your Vercel frontend URL once deployed |

4. Click **Save Changes** and wait for Render to deploy the service.
5. Keep note of your backend URL (e.g., `https://esg-backend.onrender.com`).

---

## ⚛️ Step 3: Deploy the React Frontend on Vercel

Vercel provides a superior free tier for React static sites with no sleep delays.

### 1. Configure Router Fallback (Already Created!)
Vercel needs a `vercel.json` file inside the `frontend` folder to handle client-side routing. If you reload your browser on `/dashboard` or `/login`, it redirects traffic back to `index.html` to avoid a `404 Not Found` error.

I have already created the file at `frontend/vercel.json`:
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

### 2. Deploy on Vercel
1. Go to **[vercel.com](https://vercel.com/)** and sign up using your GitHub account.
2. Click **Add New** > **Project**.
3. Select your ESG project repository.
4. Configure these options in the setup panel:
   * **Framework Preset**: `Vite` (Vercel auto-detects this)
   * **Root Directory**: `frontend`
   * **Build Command**: `npm run build`
   * **Output Directory**: `dist`
5. Expand the **Environment Variables** section and add:
   * **`VITE_API_URL`**: `https://esg-backend.onrender.com/api` (Replace with your actual Render backend URL!)
6. Click **Deploy**.

> [!IMPORTANT]
> Once Vercel deploys your frontend, it will give you a domain like `https://esg-frontend-xyz.vercel.app`. 
> Go back to your **Render Backend Dashboard** > **Environment** tab, update your `CORS_ALLOWED_ORIGINS` variable to match your Vercel URL, and save changes!

---

## 🛠️ Step 4: Run Initial Django Operations

Since Render's **Free Tier** disables interactive web shell access (as shown in your dashboard), you can easily run all database setup commands directly from **your local machine's terminal**! 

Because I have already configured your local `backend/.env` file to point directly to your cloud Neon database, any commands you run locally will execute directly on your live production database.

### How to set up your database from your local terminal:

1. Open your terminal or Command Prompt on your computer.
2. Navigate to your backend directory:
   ```bash
   cd backend
   ```
3. Run the migrations to build your database tables in Neon:
   ```bash
   python manage.py migrate
   ```
4. Create your administrative superuser to log in:
   ```bash
   python manage.py createsuperuser
   ```
   *(Follow the prompts to enter your secure username, email, and password)*
5. Pre-populate your database with realistic operational ESG demo records:
   ```bash
   python manage.py seed_demo
   ```

You are now 100% deployed and set up! Open your Vercel website link, log in with the admin credentials you just created, and explore the platform!
