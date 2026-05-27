# Data Model Documentation

## Entity Relationship Overview

```
Organization
  ├── User (1:N)
  ├── DataSource (1:N)
  ├── UploadBatch (1:N)
  ├── RawRecord (1:N)
  └── EmissionRecord (1:N)
        ├── ValidationIssue (1:N)
        └── ApprovalAction (1:N)

AuditLog (standalone, references entities by type+id)
```

## Models

### Organization
The tenant boundary. All data is scoped to an organization.

| Field      | Type         | Notes                          |
|------------|--------------|--------------------------------|
| id         | UUID (PK)    | Auto-generated                 |
| name       | CharField    | Unique                         |
| slug       | SlugField    | Unique, URL-friendly           |
| industry   | CharField    | Optional                       |
| is_active  | BooleanField | Soft-delete support            |
| created_at | DateTime     | Auto                           |
| updated_at | DateTime     | Auto                           |

### User (extends AbstractUser)
Custom user tied to one organization with role-based access.

| Field        | Type         | Notes                          |
|--------------|--------------|--------------------------------|
| id           | UUID (PK)    | Auto-generated                 |
| organization | FK → Org     | Tenant binding                 |
| role         | CharField    | admin \| analyst               |
| created_at   | DateTime     | Auto                           |
| updated_at   | DateTime     | Auto                           |

### DataSource
Registered source system per organization.

| Field       | Type         | Notes                          |
|-------------|--------------|--------------------------------|
| id          | UUID (PK)    | Auto-generated                 |
| organization| FK → Org     |                                |
| source_type | CharField    | sap \| utility \| travel       |
| name        | CharField    | Display name                   |
| description | TextField    | Optional                       |
| is_active   | BooleanField |                                |
| created_at  | DateTime     | Auto                           |
| updated_at  | DateTime     | Auto                           |

Constraint: unique_together = [organization, source_type]

### UploadBatch
One CSV upload event. Groups raw records together.

| Field          | Type         | Notes                          |
|----------------|--------------|--------------------------------|
| id             | UUID (PK)    | Auto-generated                 |
| organization   | FK → Org     |                                |
| data_source    | FK → DS      |                                |
| uploaded_by    | FK → User    | Nullable (SET_NULL)            |
| file_name      | CharField    |                                |
| file_size      | PositiveInt  | Bytes                          |
| status         | CharField    | processing/completed/failed/partial |
| total_rows     | PositiveInt  |                                |
| processed_rows | PositiveInt  |                                |
| error_rows     | PositiveInt  |                                |
| error_message  | TextField    |                                |
| created_at     | DateTime     | Auto                           |
| updated_at     | DateTime     | Auto                           |

### RawRecord
Individual CSV row stored verbatim as JSON for audit.

| Field         | Type         | Notes                          |
|---------------|--------------|--------------------------------|
| id            | UUID (PK)    | Auto-generated                 |
| organization  | FK → Org     |                                |
| upload_batch  | FK → Batch   |                                |
| row_number    | PositiveInt  | Original row position          |
| raw_data      | JSONField    | Exact CSV key-value pairs      |
| is_valid      | BooleanField | Set to false on parse failure  |
| error_message | TextField    | Parse error details            |
| created_at    | DateTime     | Auto                           |
| updated_at    | DateTime     | Auto                           |

### EmissionRecord
The unified, normalized record. This is the central entity analysts review.

| Field            | Type         | Notes                          |
|------------------|--------------|--------------------------------|
| id               | UUID (PK)    | Auto-generated                 |
| organization     | FK → Org     |                                |
| raw_record       | 1:1 → Raw    | Links back to original data    |
| upload_batch     | FK → Batch   |                                |
| source_type      | CharField    | sap \| utility \| travel       |
| scope            | CharField    | scope_1 \| scope_2 \| scope_3 |
| category         | CharField    | fuel, electricity, flight, etc.|
| activity_value   | Decimal(16,4)| Original measured value        |
| activity_unit    | CharField    | Original unit                  |
| normalized_value | Decimal(16,4)| After unit conversion          |
| normalized_unit  | CharField    | Standard unit (L, kWh, km)     |
| reporting_date   | DateField    | Nullable                       |
| description      | TextField    |                                |
| metadata         | JSONField    | Source-specific extras         |
| status           | CharField    | pending/approved/rejected/needs_review |
| created_at       | DateTime     | Auto                           |
| updated_at       | DateTime     | Auto                           |

Indexes: [org+status], [org+source_type], [org+scope], [reporting_date]

### ValidationIssue
Flags on suspicious records, created by the validation engine.

| Field           | Type         | Notes                          |
|-----------------|--------------|--------------------------------|
| id              | UUID (PK)    | Auto-generated                 |
| emission_record | FK → ER      |                                |
| severity        | CharField    | error \| warning \| info       |
| rule_name       | CharField    | Machine-readable identifier    |
| message         | TextField    | Human-readable explanation     |
| created_at      | DateTime     | Auto                           |
| updated_at      | DateTime     | Auto                           |

### ApprovalAction
Each approve/reject decision on an EmissionRecord.

| Field           | Type         | Notes                          |
|-----------------|--------------|--------------------------------|
| id              | UUID (PK)    | Auto-generated                 |
| emission_record | FK → ER      |                                |
| action          | CharField    | approved \| rejected           |
| reviewer        | FK → User    | Nullable (SET_NULL)            |
| comment         | TextField    | Optional reviewer notes        |
| previous_status | CharField    | Status before this action      |
| created_at      | DateTime     | Auto                           |
| updated_at      | DateTime     | Auto                           |

### AuditLog
Immutable log of all significant actions. Not tied to a specific model via FK — uses entity_type + entity_id pattern for flexibility.

| Field          | Type         | Notes                          |
|----------------|--------------|--------------------------------|
| id             | UUID (PK)    | Auto-generated                 |
| actor          | FK → User    | Nullable (SET_NULL)            |
| action         | CharField    | e.g. upload_started, record_approved |
| entity_type    | CharField    | Model name                     |
| entity_id      | CharField    | String UUID of affected entity |
| previous_value | JSONField    | State before                   |
| new_value      | JSONField    | State after                    |
| timestamp      | DateTime     | Auto                           |

Indexes: [entity_type+entity_id], [actor+timestamp], [action]

## Key Design Decisions

1. **UUID primary keys everywhere** — prevents enumeration attacks and simplifies multi-tenant merges
2. **JSONField for raw_data** — preserves exact CSV content without schema coupling
3. **OneToOne RawRecord ↔ EmissionRecord** — maintains traceability from normalized back to original
4. **AuditLog uses string entity references** — avoids FK coupling while still supporting queries by entity
5. **Decimal(16,4) for values** — sufficient precision for ESG quantities without floating-point issues
