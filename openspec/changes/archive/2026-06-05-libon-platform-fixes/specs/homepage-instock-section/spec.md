## ADDED Requirements

### Requirement: Homepage displays a "In-Stock Products" section sourced from anismile.jp

The system SHALL render a "現貨銷售" section on the homepage that shows individual products currently in stock, using live data from the anismile.jp `POST /instock/index` API.

#### Scenario: Rendering the section with live source data

- **WHEN** a user visits the homepage
- **THEN** the "現貨銷售" section SHALL display product cards fetched from anismile.jp `instock/index`
- **AND** each card SHALL show: product name (translated if available, otherwise original), product image, and price
- **AND** the section SHALL display all items returned by the API (up to 10 per call)

#### Scenario: Price display based on login state

- **WHEN** the user is NOT logged in
- **THEN** the selling price SHALL be hidden (displayed as "登入後查看" or similar)
- **WHEN** the user IS logged in
- **THEN** the selling price from the local DB SHALL be displayed (looked up by product `id` / JAN code)
- **AND** if no local price exists for the product, price SHALL be hidden

#### Scenario: Product card links

- **WHEN** a user clicks on an instock product card
- **THEN** they SHALL be navigated to the product detail page on Libon (matched by product `id`)
- **AND** if no matching Libon product exists, the card SHALL still render without crashing

#### Scenario: Source API unavailable

- **WHEN** the anismile.jp `instock/index` API times out or returns a non-200 status
- **THEN** the "現貨銷售" section SHALL be hidden entirely (not rendered as an empty section)
- **AND** an error SHALL be logged server-side but NOT shown to the user
