## ADDED Requirements

### Requirement: Database schema migration for anismile_series

The system SHALL provide a Prisma migration that creates the `anismile_series` table matching the existing `AnismileSeries` model in `schema.prisma`.

#### Scenario: Migration creates the table correctly

- **WHEN** the migration is applied to a fresh database
- **THEN** the `anismile_series` table exists with columns: `id` (TEXT, PK), `name` (TEXT, UNIQUE), `image_url` (TEXT, nullable), `product_count` (INT, nullable), `last_synced_at` (TIMESTAMP), `created_at` (TIMESTAMP), `updated_at` (TIMESTAMP)

#### Scenario: Migration is idempotent on existing schema

- **WHEN** the migration runs on a database that already has the `anismile_series` table (e.g., from a prior `db push`)
- **THEN** it SHALL NOT fail or corrupt existing data

### Requirement: Debug endpoint removal

The system SHALL NOT contain the `app/api/debug/r2-status/route.ts` endpoint in the repository.

#### Scenario: Debug endpoint is absent

- **WHEN** searching the codebase for `app/api/debug/r2-status`
- **THEN** no matching source file is found

#### Scenario: Debug directory is absent

- **WHEN** listing `app/api/debug/`
- **THEN** the directory does not exist or contains no route files
