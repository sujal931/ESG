# Architectural Decisions

## 1. Django App Structure

**Decision:** Six Django apps: `organizations`, `ingestion`, `normalization`, `validation`, `approvals`, `audit`.

**Why:** Each app owns a distinct domain concern. The ingestion app handles raw data intake and parsing, normalization owns the unified EmissionRecord, validation applies rules, approvals manages workflow, and audit tracks history. This separation keeps each app's models and services focused.

**Alternative considered:** A single monolithic app with everything in one place. Rejected because it would lead to a bloated models.py and tangled imports as complexity grows.

## 2. Service Layer Pattern

**Decision:** Business logic lives in service classes (e.g., `IngestionService`, `NormalizationService`, `ValidationService`), not in views or serializers.

**Why:** Views handle HTTP concerns (auth, parsing request, returning response). Services handle domain logic (parsing CSVs, normalizing units, running validation rules). This keeps views thin and services testable independently.

## 3. Raw Record Preservation

**Decision:** Store the exact CSV row as JSON in `RawRecord.raw_data` before any transformation.

**Why:** Audit requirements demand being able to trace any normalized value back to its original source. Storing the raw data as-is means we never lose information, even if normalization logic changes later.

## 4. Parser-per-Source Architecture

**Decision:** Each source type (SAP, Utility, Travel) has its own parser module that returns a common intermediate format.

**Why:** Real-world source systems have wildly different column names, date formats, and data quality issues. Dedicated parsers can handle the idiosyncrasies of each system without polluting a generic parser.

## 5. Normalization as a Separate Step

**Decision:** Normalization happens after parsing, as a distinct step that creates EmissionRecords from parsed data.

**Why:** Separating parsing (understanding the raw format) from normalization (mapping to our schema) makes each step independently testable and modifiable. A new source type only needs a parser — normalization rules stay shared.

## 6. JWT Authentication (not Session)

**Decision:** Use SimpleJWT with access/refresh token pattern.

**Why:** The frontend is a separate SPA that communicates via API. JWTs are stateless and work naturally with REST APIs. The refresh token pattern provides a good balance of security (short-lived access tokens) and UX (no frequent re-login).

## 7. Multi-Tenancy via FK Filtering

**Decision:** All querysets filter by `organization=request.user.organization`. No database-level tenant isolation.

**Why:** For the scope of this project, FK-based filtering is simple, correct, and sufficient. Row-level security or separate databases would be overengineering without a clear performance or compliance driver.

## 8. Validation as Post-Processing

**Decision:** Validation runs after normalization, creating `ValidationIssue` records linked to EmissionRecords.

**Why:** Validation needs normalized data to apply meaningful rules (e.g., "is this kWh value suspiciously high?"). Decoupling validation from ingestion means we can re-run validation rules without re-uploading data.

## 9. AuditLog with String Entity References

**Decision:** AuditLog stores `entity_type` and `entity_id` as strings, not as a GenericForeignKey.

**Why:** Simpler than Django's ContentType framework, sufficient for our needs (we query by entity_type + entity_id), and avoids the complexity of generic relations. The trade-off is no automatic referential integrity, which is acceptable for an append-only log.

## 10. Frontend State Management

**Decision:** Use React Context for auth, component-level state for everything else. No Redux, no Zustand.

**Why:** The app's state is page-scoped — each page fetches its own data. Global state is limited to the authenticated user. Adding a state management library would be premature complexity for this scope.

## 11. Tailwind CSS v4 via Vite Plugin

**Decision:** Use `@tailwindcss/vite` plugin with Tailwind v4 rather than PostCSS config.

**Why:** Tailwind v4 uses a new engine with automatic content detection. The Vite plugin integrates directly into the build pipeline without needing a separate `tailwind.config.js` or PostCSS setup.

## 12. Synchronous Ingestion Pipeline

**Decision:** CSV parsing, normalization, and validation all happen synchronously within the upload request.

**Why:** For the expected file sizes (hundreds to low thousands of rows), synchronous processing is fast enough and dramatically simpler than async task queues. The ingestion service wraps everything in a database transaction for atomicity.

See TRADEOFFS.md for what we would change at scale.
