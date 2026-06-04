## ADDED Requirements

### Requirement: Series detail page shows complete product count

The system SHALL display a product count on the series detail page that closely matches the source website.

#### Scenario: Series with many products

- **WHEN** a user visits a series detail page that has 70+ products on anismile.jp
- **THEN** the local database SHALL eventually contain all (or nearly all) of those products
- **AND** the product count displayed SHALL be within 5% of the source website count

### Requirement: Background crawling for missing series products

The system SHALL trigger series product crawling asynchronously when local data is incomplete, instead of blocking the user request.

#### Scenario: First visit to a series with incomplete data

- **WHEN** a user visits a series detail page and the local DB has fewer than 5 products for that series
- **THEN** the API SHALL return the available local products immediately
- **AND** it SHALL trigger a background job to crawl the remaining products from anismile.jp
- **AND** the background job SHALL use a limit of at least 200 products

#### Scenario: Background crawl completion

- **WHEN** the background crawl completes successfully
- **THEN** the crawled products SHALL be upserted into the local database
- **AND** subsequent visits to the same series SHALL display the complete product list

##### Example:

- **GIVEN** the series "アイカツ! 10th STORY" has 2 products in local DB
- **WHEN** user visits the series detail page (triggers background crawl)
- **THEN** API returns the 2 local products immediately (no blocking)
- **AND** within ~30 seconds, crawler upserts up to 200 products into DB
- **AND** on next page visit, the series shows 70+ products

### Requirement: Improved series name matching

The system SHALL match series names between the source API and local database using normalized comparison.

#### Scenario: Series name with punctuation variations

- **WHEN** the source series name contains "！" (full-width exclamation)
- **THEN** the system SHALL normalize it to "!" (half-width) before matching
- **AND** it SHALL also normalize "截單" ↔ "截单" variations
- **AND** matching SHALL use `startsWith` as a fallback when exact match fails
