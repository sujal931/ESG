# Tradeoffs & What Was Intentionally Not Built

## Intentional Omissions

### 1. Async Task Queue (Celery)
**What:** Background processing for large CSV uploads.
**Why not:** Synchronous processing handles the expected file sizes (< 10K rows) well. Adding Celery introduces Redis/RabbitMQ dependency, worker management, and retry logic — significant operational complexity.
**When to add:** When file sizes regularly exceed 50K rows or processing time exceeds 30 seconds.

### 2. Emission Factor Calculations
**What:** Converting activity data (liters of diesel, kWh of electricity) into CO2 equivalent using emission factors.
**Why not:** Emission factors vary by region, fuel type, grid mix, and reporting standard (GHG Protocol, EPA, DEFRA). Hardcoding factors would be misleading. This is a feature that requires domain expert input and a dedicated emission factor database.
**When to add:** When integrating with an emission factor library (e.g., Climatiq API) or when domain experts provide approved factors.

### 3. File Storage (S3/Azure Blob)
**What:** Storing uploaded CSV files for later re-processing.
**Why not:** We store all raw row data as JSON in the database, which satisfies audit requirements. File storage adds cloud provider dependency.
**When to add:** When regulatory requirements mandate retaining original files, or when you need to reprocess entire files.

### 4. WebSocket Real-Time Updates
**What:** Live updates when records are approved or new data is uploaded.
**Why not:** The analyst workflow is poll-based (refresh page, check dashboard). WebSockets add significant complexity (Django Channels, Redis) for minimal UX benefit in a back-office tool.

### 5. Role-Based Permissions (Fine-Grained)
**What:** Analysts can only approve, admins can manage everything, read-only roles, etc.
**Why not:** The current admin/analyst distinction is sufficient. Fine-grained RBAC adds complexity to every view and serializer. The permission infrastructure is in place (`IsOrganizationMember`, `IsAdmin`) and can be extended.

### 6. Data Export / Reporting
**What:** Export approved records as CSV/Excel, generate PDF reports.
**Why not:** Time constraint. The API returns all data needed for export — a frontend CSV download or report generator can be added without backend changes.

### 7. Automated Testing
**What:** Unit tests for parsers, integration tests for ingestion pipeline.
**Why not:** Time constraint in a 4-day build. The service architecture is designed for testability — parsers are pure functions, services have clear interfaces. Tests should be the first thing added next.

### 8. API Rate Limiting
**What:** Throttle API requests to prevent abuse.
**Why not:** DRF has built-in throttling, but configuring it properly requires understanding usage patterns. Easy to add via `DEFAULT_THROTTLE_CLASSES` in settings.

### 9. Multi-Language Support
**What:** i18n for the frontend, localized error messages.
**Why not:** Scope constraint. The platform is English-only for now.

### 10. Optimistic Locking
**What:** Prevent two analysts from approving/rejecting the same record simultaneously.
**Why not:** With small analyst teams, conflicts are rare. The approval history always records all actions, so audit integrity is maintained even with concurrent updates.

## Known Limitations

1. **Airport Distance Lookup** — Uses a hardcoded table of ~30 airport pairs. Real implementation would use a GIS library or API.
2. **SAP Material Classification** — Simple string matching on material numbers. Real SAP integration would use material groups or custom classification tables.
3. **Unit Conversion** — Covers L/GAL/M3 for fuel and kWh/MWh for electricity. KG and MT conversions require material density, which we flag for manual review.
4. **Date Parsing** — Handles 6 common formats. Real SAP exports may have additional locale-specific formats.
5. **Duplicate Detection** — Uses exact-match on key fields. Fuzzy matching would catch more duplicates but increases false positives.
6. **No Undo** — Approval actions cannot be reversed, only superseded by a new action.

## Scaling Considerations

If this system needed to handle enterprise-scale data:

- **Add Celery + Redis** for async CSV processing
- **Move to chunked file uploads** for files > 50MB
- **Add database read replicas** for analytics queries
- **Consider TimescaleDB** for time-series emission data
- **Add API caching** (Redis) for dashboard stats
- **Implement cursor-based pagination** for large result sets
