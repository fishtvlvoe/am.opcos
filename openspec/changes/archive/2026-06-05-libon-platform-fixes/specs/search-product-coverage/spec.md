## ADDED Requirements

### Requirement: Search page displays all synced products by default

The system SHALL display all synced products (both pre-order and in-stock) on the search page when no keyword query is entered, rather than filtering to in-stock only.

#### Scenario: Browsing without a keyword

- **WHEN** a user visits `/search` without entering a keyword
- **THEN** the product grid SHALL include pre-order products (those with a future `orderDeadline`) in addition to in-stock products
- **AND** products with an expired `orderDeadline` (past today) SHALL still be excluded
- **AND** the total count shown SHALL reflect all non-expired synced products

#### Scenario: Applying the "即將截單" quick filter

- **WHEN** a user checks the "即將截單" quick filter on the search page
- **THEN** only products with `orderDeadline` within the next 7 days SHALL be shown
- **AND** this filter SHALL work regardless of the `inStock` field value

#### Scenario: Applying the "現貨" quick filter

- **WHEN** a user checks the "現貨" quick filter on the search page
- **THEN** only products with `inStock: true` SHALL be shown
- **AND** other non-in-stock products SHALL be hidden

#### Scenario: Keyword search behavior is unchanged

- **WHEN** a user enters a keyword into the search bar
- **THEN** the system SHALL search all non-expired products (not only in-stock)
- **AND** results SHALL match on `titleOriginal`, `titleTranslated`, `series`, `franchise`, `brand`, or `janCode`
