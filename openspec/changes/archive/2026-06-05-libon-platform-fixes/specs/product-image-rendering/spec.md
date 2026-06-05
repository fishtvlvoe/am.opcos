## ADDED Requirements

### Requirement: Series cards use optimized image loading

The system SHALL render series card images using Next.js `<Image>` component with lazy loading and responsive sizing.

#### Scenario: Homepage series grid

- **WHEN** the homepage series grid renders
- **THEN** each series card image SHALL use `next/image` `<Image>` component
- **AND** it SHALL specify `fill` with `sizes` attribute for responsive breakpoints
- **AND** it SHALL use `object-cover` for consistent aspect ratio
- **AND** images outside the viewport SHALL be lazy-loaded

#### Scenario: Missing image fallback

- **WHEN** a series has no available image URL
- **THEN** the card SHALL display a placeholder text "系列圖片" instead of a broken image

### Requirement: Product detail images use optimized loading

The system SHALL render product detail page images using Next.js `<Image>` component.

#### Scenario: Related products section

- **WHEN** the product detail page displays related products
- **THEN** each related product image SHALL use `next/image` `<Image>` component
- **AND** it SHALL specify appropriate `width` and `height` or `fill` with `sizes`

### Requirement: Admin product images use optimized loading

The system SHALL render admin product list images using Next.js `<Image>` component.

#### Scenario: Admin product table

- **WHEN** the admin products page renders the product table
- **THEN** each product thumbnail SHALL use `next/image` `<Image>` component
- **AND** it SHALL specify `width={40}` and `height={40}` for consistent sizing
