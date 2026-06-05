## MODIFIED Requirements

### Requirement: Visual auth bypass is development-only

The visual-test auth bypass SHALL only be active when `NODE_ENV` is `development`. All other environments (production, staging, test, preview) SHALL enforce authentication regardless of the `ANISMILE_VISUAL_TEST_BYPASS_AUTH` environment variable.

#### Scenario: Bypass env is set in production

- **WHEN** `NODE_ENV` is `production` and `ANISMILE_VISUAL_TEST_BYPASS_AUTH=1`
- **THEN** unauthenticated users SHALL be redirected to login

#### Scenario: Bypass env is set in staging or test

- **WHEN** `NODE_ENV` is `test`, `staging`, or any value other than `development`
- **AND** `ANISMILE_VISUAL_TEST_BYPASS_AUTH=1`
- **THEN** unauthenticated users SHALL be redirected to login
- **AND** admin pages SHALL NOT be accessible without a valid session

#### Scenario: Bypass env is set in development

- **WHEN** `NODE_ENV` is `development` and `ANISMILE_VISUAL_TEST_BYPASS_AUTH=1`
- **THEN** the auth check SHALL be skipped and the mock admin session SHALL be used

---

## ADDED Requirements

### Requirement: Public product page returns 404 for unlisted products

The system SHALL return HTTP 404 when a public request targets a product whose `inStock` field is `false`, preventing access to delisted product data via direct URL.

#### Scenario: Direct URL to unlisted product

- **WHEN** an unauthenticated user requests `/products/<id>` for a product with `inStock: false`
- **THEN** the page SHALL respond with HTTP 404

#### Scenario: Admin can still access unlisted products

- **WHEN** an authenticated admin requests a product with `inStock: false` via the admin procedures
- **THEN** the product data SHALL be returned normally

### Requirement: addToCart cumulative quantity is bounded

The system SHALL ensure that the total quantity for a single cart item never exceeds 999, regardless of how many times `addToCart` is called.

#### Scenario: Cumulative add exceeds 999

- **WHEN** a user calls `addToCart` for the same product with `quantity: 600` twice
- **THEN** the stored `quantity` SHALL be 999, not 1200

#### Scenario: Single add within limit

- **WHEN** a user calls `addToCart` with `quantity: 5` and the item does not yet exist
- **THEN** the stored `quantity` SHALL be 5

### Requirement: batchAddToCart skips products past order deadline

The system SHALL not add products to the cart via `batchAddToCart` when their `orderDeadline` has passed.

#### Scenario: Wishlist batch-add includes expired product

- **WHEN** `batchAddToCart` is called with a list that includes a product whose `orderDeadline` is in the past
- **THEN** that product SHALL NOT be added to the cart
- **AND** products with a future `orderDeadline` SHALL be added normally

### Requirement: Search results exclude delisted products by default

The system SHALL exclude products with `inStock: false` from search results unless the caller explicitly requests unavailable products.

#### Scenario: Default search returns only available products

- **WHEN** `searchAnismileProducts` is called without an explicit `inStock` filter
- **THEN** the results SHALL only contain products where `inStock` is `true`

### Requirement: Wishlist deadline sort orders by order deadline

The system SHALL sort wishlist items by `orderDeadline` ascending when the sort option `deadline` is selected.

#### Scenario: Deadline sort

- **WHEN** `listWishlist` is called with `sortBy: "deadline"`
- **THEN** the returned items SHALL be ordered by `product.orderDeadline` ascending (earliest deadline first)
