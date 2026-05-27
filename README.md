# ESG Data Ingestion & Analyst Review Platform

A full-stack enterprise ESG (Environmental, Social, Governance) data ingestion and analyst review platform. Supports multi-tenant organizations uploading operational data from SAP, Utility, and Travel systems — normalizing, validating, and approving records before audit sign-off.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    React + Tailwind                      │
│                    Frontend (Vite)                       │
├─────────────────────────────────────────────────────────┤
│                     Nginx / Vite Proxy                   │
├─────────────────────────────────────────────────────────┤
│              Django REST Framework API                   │
│  ┌───────────┬──────────┬───────────┬──────────────┐    │
│  │ Ingestion │ Normal.  │ Validation│  Approvals   │    │
│  ├───────────┴──────────┴───────────┴──────────────┤    │
│  │          Organizations  │  Audit                │    │
│  └─────────────────────────┴──────────────────────┘    │
├─────────────────────────────────────────────────────────┤
│                    PostgreSQL                            │
└─────────────────────────────────────────────────────────┘
```

## Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL 14+

### Backend Setup

```bash
cd backend
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # macOS/Linux
pip install -r requirements.txt

# Copy env file and configure
copy .env.example .env

# Create database
createdb esg_platform

# Migrate and seed
python manage.py migrate
python manage.py seed_demo

# Run
python manage.py runserver
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

### Docker (Full Stack)

```bash
docker-compose up --build
```

Backend at `http://localhost:8000`, Frontend at `http://localhost:5173`

## Demo Credentials

| Role    | Username | Password    |
|---------|----------|-------------|
| Admin   | admin    | admin123!   |
| Analyst | analyst  | analyst123! |

## Role-Based Access Control

| Feature                      | Admin | Analyst |
|------------------------------|-------|---------|
| Login                        | ✅    | ✅      |
| Upload data                  | ✅    | ✅      |
| View organization data       | ✅    | ✅      |
| Review suspicious rows       | ✅    | ✅      |
| Approve/reject records       | ✅    | ✅      |
| Edit normalized records      | ✅    | ✅      |
| Manage users (CRUD)          | ✅    | ❌      |
| Update organization settings | ✅    | ❌      |
| Configure validation rules   | ✅    | Read-only |
| View audit logs              | ✅ All | Own only |
| Lock records for audit       | ✅    | ❌      |
| Delete uploads               | ✅    | ❌      |
| Reprocess failed ingestion   | ✅    | ❌      |
| Bulk approve/reject          | ✅    | ❌      |

## Sample Data

The `sample_data/` directory contains realistic CSV files with intentional data quality issues:

- `sap_fuel_export.csv` — SAP fuel procurement with German columns, mixed units, duplicates
- `utility_electricity.csv` — Utility bills with missing meters, extreme usage, duplicates
- `corporate_travel.csv` — Travel data with invalid airports, missing distances, duplicates

## API Endpoints

### Auth & Users
| Method | Endpoint                               | Access   | Description                    |
|--------|----------------------------------------|----------|--------------------------------|
| POST   | `/api/auth/login/`                     | Public   | JWT login                      |
| POST   | `/api/auth/register/`                  | Public   | Register user                  |
| POST   | `/api/auth/refresh/`                   | Public   | Refresh JWT token              |
| GET    | `/api/auth/me/`                        | All      | Current user                   |
| GET    | `/api/auth/users/`                     | Admin    | List org users                 |
| POST   | `/api/auth/users/`                     | Admin    | Create user                    |
| PATCH  | `/api/auth/users/<id>/`                | Admin    | Update user                    |
| DELETE | `/api/auth/users/<id>/`                | Admin    | Remove user                    |
| GET    | `/api/auth/organization/`              | All      | View org details               |
| PATCH  | `/api/auth/organization/`              | Admin    | Update org settings            |

### Ingestion
| Method | Endpoint                               | Access   | Description                    |
|--------|----------------------------------------|----------|--------------------------------|
| POST   | `/api/ingestion/upload/`               | All      | Upload CSV                     |
| GET    | `/api/ingestion/batches/`              | All      | List upload batches            |
| GET    | `/api/ingestion/batches/<id>/`         | All      | Batch detail                   |
| GET    | `/api/ingestion/batches/<id>/raw/`     | All      | Raw records in batch           |
| DELETE | `/api/ingestion/batches/<id>/delete/`  | Admin    | Delete upload batch            |
| POST   | `/api/ingestion/batches/<id>/reprocess/` | Admin  | Reprocess failed rows          |
| GET    | `/api/ingestion/stats/`                | All      | Upload statistics              |

### Records
| Method | Endpoint                               | Access   | Description                    |
|--------|----------------------------------------|----------|--------------------------------|
| GET    | `/api/records/`                        | All      | List emission records          |
| GET    | `/api/records/dashboard/`              | All      | Dashboard stats                |
| GET    | `/api/records/<id>/`                   | All      | Record detail                  |
| PATCH  | `/api/records/<id>/edit/`              | All      | Edit normalized fields         |
| POST   | `/api/records/<id>/lock/`              | Admin    | Lock/unlock record for audit   |
| POST   | `/api/records/bulk-lock/`              | Admin    | Bulk lock/unlock records       |

### Validation
| Method | Endpoint                               | Access      | Description                    |
|--------|----------------------------------------|-------------|--------------------------------|
| GET    | `/api/validation/issues/`              | All         | List validation issues         |
| GET    | `/api/validation/issues/<id>/`         | All         | Issues for specific record     |
| GET    | `/api/validation/rules/`               | All         | List validation rules          |
| POST   | `/api/validation/rules/`               | Admin       | Create validation rule         |
| PATCH  | `/api/validation/rules/<id>/`          | Admin       | Update validation rule         |
| DELETE | `/api/validation/rules/<id>/`          | Admin       | Delete validation rule         |

### Approvals
| Method | Endpoint                               | Access   | Description                    |
|--------|----------------------------------------|----------|--------------------------------|
| POST   | `/api/approvals/<id>/`                 | All      | Approve/reject record          |
| POST   | `/api/approvals/bulk/`                 | Admin    | Bulk approve/reject            |
| GET    | `/api/approvals/history/<id>/`         | All      | Approval history               |

### Audit
| Method | Endpoint                               | Access       | Description                    |
|--------|----------------------------------------|--------------|--------------------------------|
| GET    | `/api/audit/`                          | Admin: All, Analyst: Own | Audit logs         |
| GET    | `/api/audit/<type>/<id>/`              | All          | Entity-specific audit          |

## Tech Stack

**Backend:** Django 4.2, Django REST Framework, PostgreSQL, JWT (SimpleJWT)
**Frontend:** React 18, Tailwind CSS v4, Vite, Axios, React Router
**Deployment:** Docker, Docker Compose, Gunicorn, Nginx, WhiteNoise

## Project Structure

```
ESG/
├── backend/
│   ├── config/           # Django settings, URLs, WSGI
│   ├── organizations/    # Org + User models, auth views, user management
│   │   └── permissions.py # IsAdmin, IsAdminOrReadOnly, IsOrganizationMember
│   ├── ingestion/        # CSV upload, parsers, raw records
│   │   └── services/     # SAP, Utility, Travel parsers (+ row-level reprocessing)
│   ├── normalization/    # EmissionRecord model, normalization service, record editing
│   ├── validation/       # ValidationIssue + ValidationRule models, rule engine
│   ├── approvals/        # ApprovalAction model, review views (+ lock checks)
│   ├── audit/            # AuditLog model, audit service (role-filtered)
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/   # Layout, Badges, Shared
│   │   ├── pages/        # Login, Dashboard, Upload, Records, Detail
│   │   ├── api.js        # Axios API client
│   │   ├── AuthContext.jsx
│   │   ├── ThemeContext.jsx  # Light/Dark mode + sidebar state
│   │   └── App.jsx
│   ├── Dockerfile
│   └── nginx.conf
├── sample_data/          # Sample CSVs with bad data
├── docker-compose.yml
├── MODEL.md
├── DECISIONS.md
├── TRADEOFFS.md
└── SOURCES.md
```
