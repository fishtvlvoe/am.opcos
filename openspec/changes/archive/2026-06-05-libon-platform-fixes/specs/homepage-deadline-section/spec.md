## ADDED Requirements

### Requirement: Homepage displays an "Upcoming Deadlines" section sourced from anismile.jp

The system SHALL render an "即將截單" section on the homepage that shows series with upcoming order deadlines, using live data from the anismile.jp `POST /deadline_list/index` API.

#### Scenario: Rendering the section with live source data

- **WHEN** a user visits the homepage
- **THEN** the "即將截單" section SHALL display series cards fetched from anismile.jp `deadline_list/index`
- **AND** each card SHALL show: series name (translated), series image, deadline date, and product count
- **AND** the section SHALL show at least the first 12 series returned by the API (dayOffset=0)

#### Scenario: Deadline date display

- **WHEN** a series has `deadline_date: "2026年06月04日"` and `earliest_deadline: <unix_timestamp>`
- **THEN** the UI SHALL display the deadline date in a localized format (e.g. "6月4日截單")
- **AND** the series card SHALL link to the corresponding series detail page on Libon (matched by series name)

#### Scenario: Source API unavailable — fallback to local DB

- **WHEN** the anismile.jp `deadline_list/index` API times out or returns a non-200 status
- **THEN** the system SHALL fall back to querying the local database for products with `orderDeadline` within the next 7 days (existing `getDeadlineProducts` behavior)
- **AND** the section SHALL still render with local data without throwing an error to the user

#### Scenario: Missing series image

- **WHEN** a deadline series has no image from the source API
- **THEN** the card SHALL display the placeholder text or a grey placeholder box — it SHALL NOT render a broken image tag

##### Example:

- **GIVEN** `deadline_list/index` returns `{ id: 9999, name: "テスト・6月4日截单", file: { url: "", thumb: "" }, product_count: 5, ... }`
- **WHEN** the DeadlineSection renders this item
- **THEN** the card shows the series name "テスト・6月4日截单" and a placeholder box instead of a broken `<img>` tag
- **AND** no `<img>` element with empty `src` appears in the DOM
