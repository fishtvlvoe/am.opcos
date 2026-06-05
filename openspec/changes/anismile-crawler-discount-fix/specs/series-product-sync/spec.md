## ADDED Requirements

### Requirement: Discount rate must be correctly parsed from source API

The crawler SHALL use `price_percent` as the primary source for `discountRate`, and SHALL fall back to `item.percent` only when `item.percent.status === 1`.

#### Scenario: Source API returns discount in price_percent

- **GIVEN** the source API returns `item.price_percent` as a numeric string (e.g. `"70"` meaning 70% of original price)
- **AND** `item.percent.status` is `0`
- **WHEN** the crawler parses the product
- **THEN** `discountRate` SHALL be `70`
- **AND** `costPrice` SHALL be `Math.round(originalPrice * 70) / 100`

#### Scenario: price_percent absent, percent.status is 1

- **GIVEN** `item.price_percent` is null
- **AND** `item.percent` is `{ status: 1, percent: "75" }`
- **WHEN** the crawler parses the product
- **THEN** `discountRate` SHALL be `75`

#### Scenario: Both sources absent

- **GIVEN** `item.price_percent` is null and `item.percent.status` is `0`
- **WHEN** the crawler parses the product
- **THEN** `discountRate` SHALL be `null`
- **AND** `costPrice` SHALL equal `originalPrice`

## ADDED Requirements

### Requirement: Crawl result validates discount coverage

The crawler SHALL emit a warning when fewer than 10% of crawled products have a non-null `discountRate`.

#### Scenario: Low discount coverage detected

- **GIVEN** a crawl batch of 100 products where 5 have `discountRate != null`
- **WHEN** `crawlAnismileProductsWithStats` completes
- **THEN** a warning log SHALL be emitted containing the discount ratio percentage and batch size

### Requirement: Sync log records discount statistics

The sync runner SHALL record discount coverage statistics in the sync log after each run.

#### Scenario: Sync log with normal coverage

- **WHEN** `runSync` completes with 80% products having discountRate
- **THEN** the sync log error message SHALL NOT contain a discount-alert

#### Scenario: Sync log with low coverage

- **WHEN** `runSync` completes with fewer than 10% products having discountRate
- **THEN** the sync log `errorMessage` SHALL contain `[discount-alert]` and the ratio
