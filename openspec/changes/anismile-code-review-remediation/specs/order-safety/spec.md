## ADDED Requirements

### Requirement: CSV import quantities are valid
CSV order import SHALL reject non-integer, zero, negative, and excessive quantities before creating an order.

#### Scenario: CSV contains invalid quantity
- **WHEN** a user uploads or submits a CSV row with an invalid quantity
- **THEN** the system rejects the import and does not create an order.

### Requirement: Import order confirmation respects product availability
Import order confirmation SHALL reject products that are unavailable or past their order deadline.

#### Scenario: Imported product is unavailable
- **WHEN** a matched imported product is no longer in stock or is past its order deadline
- **THEN** order creation is rejected with a customer-safe message.

### Requirement: Checkout blocks unavailable cart items
Checkout SHALL prevent order submission when the cart contains unavailable products.

#### Scenario: User reaches checkout with unavailable item
- **WHEN** the cart has any item with an unavailable reason
- **THEN** the checkout submit action is disabled
- **AND** submitting is blocked before the checkout mutation runs.

### Requirement: Admin order export is manual
The admin order export query SHALL run only when the admin explicitly requests CSV export.

#### Scenario: Admin opens order list
- **WHEN** an admin opens the orders page
- **THEN** the CSV export query is not executed automatically.

### Requirement: Admin settings separates notification access from super-admin controls
Admin settings SHALL allow admins to manage notification settings while keeping role management and default markup controls super-admin only.

#### Scenario: Admin opens settings
- **WHEN** a user with role `admin` opens settings
- **THEN** notification settings are available
- **AND** role management and default markup controls are hidden.
