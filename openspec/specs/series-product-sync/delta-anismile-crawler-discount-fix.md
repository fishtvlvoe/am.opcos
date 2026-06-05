# Delta: series-product-sync — Discount Field Capture

## Requirement: Discount rate must be correctly parsed from source API

The system SHALL parse the product cost/discount rate from the source API using the field that actually carries the value, not merely a field whose status flag indicates availability.

### Scenario: Source API returns discount in `price_percent`

- **GIVEN** the source API returns `item.price_percent` as a numeric string (e.g. `"70"` meaning 70% of original price)
- **AND** `item.percent.status` is `0` (not `1`)
- **WHEN** the crawler parses the product
- **THEN** `discountRate` SHALL be `70`
- **AND** `costPrice` SHALL be `originalPrice * 0.70`

### Scenario: Validation after crawl

- **WHEN** a crawl batch completes
- **THEN** the system SHALL compute the ratio of products with `discountRate != null`
- **AND** if the ratio is below 10% and the batch size is > 0
- **THEN** it SHALL log a warning including the ratio and batch size

### Scenario: Sync log records discount statistics

- **WHEN** `runSync` finishes
- **THEN** it SHALL record `productsWithDiscount` and `productsWithoutDiscount` in the sync log
- **AND** if the discount ratio is below 10%
- **THEN** it SHALL set `errorMessage` to an alert containing the ratio and actionable context

## Requirement: Auth state must match the actual authentication mechanism

The system SHALL set `sourceAuthState` to `"authenticated"` when authenticated credentials are used to fetch data, and to `"public"` only when no authentication is used.

### Scenario: Authenticated crawl uses authenticated cookie

- **GIVEN** the crawler logs in with `ANISMILE_EMAIL` and `ANISMILE_PASSWORD` to obtain a cookie
- **WHEN** it parses the product response
- **THEN** `sourceAuthState` SHALL be `"authenticated"`
- **AND** `upsertProductsFromSync` SHALL NOT trigger `preserveExistingSourcePricingTruth`

### Scenario: Stale pricing detection

- **GIVEN** an existing product has pricing data
- **AND** a new crawl returns different pricing values
- **AND** `preserveExistingSourcePricingTruth` is true
- **THEN** the system SHALL log a warning with the product ID and both old/new pricing values
