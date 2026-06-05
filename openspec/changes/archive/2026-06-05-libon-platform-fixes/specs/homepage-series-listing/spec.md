## ADDED Requirements

### Requirement: Date tab switching reflects correct series list

The system SHALL display the correct series list when the user switches the daily listing date tab on the homepage.

#### Scenario: Switching to a non-current date

- **WHEN** the user clicks a date tab other than the current day (e.g., "6月2日上架")
- **THEN** the series grid SHALL display the series that were listed on that specific date according to anismile.jp

#### Scenario: Current date tab

- **WHEN** the user views the current day's tab (default)
- **THEN** the series grid SHALL display the current day's series from anismile.jp `series_list/index`

### Requirement: Fallback to local DB when source API is unavailable

The system SHALL fall back to local database queries when the anismile.jp `series_list/index` API fails or returns empty results.

#### Scenario: Source API timeout

- **WHEN** the `series_list/index` request times out or returns non-OK status
- **THEN** the system SHALL query the local database for series with `listingDate` matching the requested date
- **AND** the response SHALL include a flag indicating fallback was used

### Requirement: Limit concurrent source API requests

The system SHALL limit concurrent requests to anismile.jp when building the series image fallback map.

#### Scenario: Building series image map

- **WHEN** the system needs to fetch series image mappings from the source
- **THEN** it SHALL make at most 7 concurrent requests (one per day)
- **AND** each request SHALL use `next: { revalidate: 300 }` caching
