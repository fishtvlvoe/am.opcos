## ADDED Requirements

### Requirement: Admin mutations use middleware authorization
Admin-only Anismile mutations SHALL enforce role authorization through the shared admin procedure middleware instead of duplicating role checks inside each handler.

#### Scenario: Admin updates member tier
- **WHEN** a signed-in admin or super admin calls the member tier update mutation
- **THEN** the request is authorized by the admin middleware
- **AND** a normal admin remains unable to assign the VIP tier.

#### Scenario: Admin batch updates product-pool item status
- **WHEN** a signed-in admin or super admin calls the product-pool batch status mutation
- **THEN** the request is authorized by the admin middleware.

### Requirement: Admin item status input is bounded
The product-pool batch status mutation SHALL accept only known order item statuses.

#### Scenario: Invalid status is submitted
- **WHEN** a caller submits a status outside `pending`, `confirmed`, `shipped`, `completed`, or `cancelled`
- **THEN** validation rejects the request before writing to the database.

### Requirement: Visual auth bypass is development-only
The visual-test auth bypass SHALL be ignored in production.

#### Scenario: Bypass env is accidentally set in production
- **WHEN** `NODE_ENV` is `production` and `ANISMILE_VISUAL_TEST_BYPASS_AUTH=1`
- **THEN** unauthenticated users are still redirected to login.

### Requirement: Cron summary auth fails closed
The order-summary cron route SHALL reject execution when `CRON_SECRET` is missing.

#### Scenario: Cron secret is not configured
- **WHEN** the cron route receives any request and `CRON_SECRET` is empty or missing
- **THEN** the route returns an error without sending email.
