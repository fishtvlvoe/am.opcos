## ADDED Requirements

### Requirement: External API crawler must include field inventory before implementation

Any change that adds or modifies an external API crawler SHALL include a field inventory documenting all API response fields, their data types, expected value ranges, and which fields map to database columns.

#### Scenario: New crawler submitted for review

- **GIVEN** a PR that adds a new external API crawler
- **WHEN** the reviewer checks the PR
- **THEN** there SHALL be a field inventory comment or design document listing all API fields used
- **AND** for each price or cost field, the formula from API value to stored DB value SHALL be documented

### Requirement: External API crawler must validate critical field coverage after crawl

Any crawler that reads cost or price fields from an external API SHALL compute the ratio of records where the field is non-null, and SHALL emit a warning when the ratio falls below the configured threshold.

#### Scenario: Price field unexpectedly null for most records

- **GIVEN** a crawler that reads `price_percent` from an API
- **WHEN** fewer than 10% of the crawled records have a non-null value for that field
- **THEN** the crawler SHALL emit a warning log entry identifying the field and the observed ratio
- **AND** the warning SHALL suggest checking whether the API contract or field name has changed

### Requirement: Crawler skill must be invoked for all external API crawler tasks

The `external-api-crawler-audit` Claude Code skill SHALL be invoked at the start of any task that adds or modifies an external API crawler, before implementation begins.

#### Scenario: Agent starts a crawler modification task

- **GIVEN** a task description that mentions modifying an existing API crawler
- **WHEN** the agent begins the task
- **THEN** the agent SHALL invoke the `external-api-crawler-audit` skill and complete its checklist before writing code
