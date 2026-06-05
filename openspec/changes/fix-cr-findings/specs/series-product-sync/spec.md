## ADDED Requirements

### Requirement: Background series crawl preserves Traditional Chinese series field

The system SHALL ensure that the `series` field on `AnismileProduct` is always stored in Traditional Chinese, including when updated by the background crawl triggered by `crawlAnismileProductsBySeriesName`.

#### Scenario: Background crawl for low-result series

- **WHEN** `crawlAnismileProductsBySeriesName` is triggered because a series page has fewer than 5 products
- **THEN** the `series` field written to the database SHALL be the Traditional Chinese form of the series name
- **AND** it SHALL NOT overwrite a previously stored Traditional Chinese `series` value with a simplified or untranslated value

#### Scenario: Series name containing simplified Chinese deadline suffix

- **WHEN** the anismile.jp source provides a series name such as `某系列・6月28日截单`
- **THEN** the value stored in `AnismileProduct.series` SHALL be `某系列・6月28日截單` (Traditional Chinese)
- **AND** the value stored in `AnismileSeries.name` SHALL be the original `某系列・6月28日截单` (preserved as-is for deduplication)

##### Example: translation consistency

| Source name (anismile.jp) | AnismileProduct.series (stored) | AnismileSeries.name (stored) |
|---------------------------|--------------------------------|------------------------------|
| `DEATH NOTE・ステラノーツ・6月28日截单` | `DEATH NOTE・ステラノーツ・6月28日截單` | `DEATH NOTE・ステラノーツ・6月28日截单` |
| `鬼滅の刃` | `鬼滅の刃` | `鬼滅の刃` |
| `My Hero Academia` | `My Hero Academia` | `My Hero Academia` |

### Requirement: discountRate stored as Decimal

The system SHALL store `discountRate` as a `Prisma.Decimal` value in all write paths, including batch patch operations.

#### Scenario: Batch patch with discountRate

- **WHEN** `batchPatchProducts` is called with `discountRate: 0.85`
- **THEN** the database SHALL store the value as a Decimal equivalent to `0.85`
- **AND** it SHALL NOT be stored as a JavaScript float that may lose precision
