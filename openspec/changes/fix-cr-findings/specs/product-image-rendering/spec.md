## ADDED Requirements

### Requirement: R2 series image key is collision-free

The system SHALL derive the R2 storage key for a series image using a content-stable hash of the series name, not a character-filtered ASCII slug.

#### Scenario: Japanese series name produces unique key

- **WHEN** `getR2Key` is called with a Japanese series name such as `鬼滅の刃`
- **THEN** it SHALL return a key in the form `series/<16-hex-chars>.jpg`
- **AND** the key SHALL NOT be `series/.jpg`

#### Scenario: Two distinct series names produce distinct keys

- **WHEN** `getR2Key` is called with `鬼滅の刃` and separately with `ワンピース`
- **THEN** the two returned keys SHALL NOT be equal

##### Example: hash uniqueness

| Series Name | Expected key pattern | Must not equal |
|-------------|----------------------|---------------|
| `鬼滅の刃` | `series/<16-hex>.jpg` | `series/.jpg` |
| `ワンピース` | `series/<16-hex>.jpg` | key for `鬼滅の刃` |
| `My Hero Academia` | `series/<16-hex>.jpg` | `series/my-hero-academia.jpg` |

---

### Requirement: Series image map lookup tolerates simplified-to-traditional variation

The system SHALL store both the original and the Traditional-Chinese-converted form of each series name as keys in the series image map, so that product series fields (which are stored as Traditional Chinese) can resolve a fallback image.

#### Scenario: Fallback image found for series with simplified-Chinese deadline suffix

- **WHEN** `getDbSeriesImageMap` loads series whose `name` contains simplified Chinese (e.g., `某系列・6月28日截单`)
- **THEN** the map SHALL contain an entry for both `某系列・6月28日截单` and `某系列・6月28日截單`
- **AND** `getSeriesFallbackImage` called with `某系列・6月28日截單` SHALL return the correct image URL

#### Scenario: No duplicate entry when names are identical after conversion

- **WHEN** the Traditional Chinese conversion of a series name equals the original name
- **THEN** only one map entry SHALL be created for that series

---

### Requirement: getProductsByDate applies image fallback before returning products

The system SHALL apply `getDisplayImageUrls` to every product returned by the `getProductsByDate` handler so that placeholder images are replaced with series fallback images.

#### Scenario: Product with placeholder image in getProductsByDate result

- **WHEN** `getProductsByDate` is called for a date that includes products whose first `imageUrls` entry is a placeholder
- **THEN** each such product SHALL have its image replaced with the series fallback image if one is available
- **AND** the raw placeholder URL SHALL NOT be the first element of `imageUrls` in the response

---

### Requirement: SafeImage resets error state when source URL changes

The system SHALL reset the image error state when the `src` prop of `SafeImage` changes, so that a newly selected image is not shown as failed.

#### Scenario: User switches gallery thumbnail after an image load error

- **WHEN** a `SafeImage` component has `error=true` and its `src` prop changes to a different URL
- **THEN** the error state SHALL be reset to `false`
- **AND** the component SHALL attempt to load the new image

---

### Requirement: Deadline section fallback skips placeholder images

The system SHALL select the first non-placeholder image URL when building the image URL for each deadline series, rather than unconditionally using the first URL in the array.

#### Scenario: First image URL is a placeholder

- **WHEN** the deadline series list fallback path builds `imageUrl` for a series whose first URL contains `length_shadow_white`
- **THEN** the selected `imageUrl` SHALL be the first URL that does NOT contain `length_shadow_white`
- **AND** if no non-placeholder URL exists, `imageUrl` SHALL be empty string

---

### Requirement: normalizeSourceImageUrl has a single implementation

The system SHALL have exactly one implementation of `normalizeSourceImageUrl`, exported from `@repo/database`, and all callers SHALL import from that location.

#### Scenario: series-sync uses the shared normalizer

- **WHEN** `packages/api/modules/anismile/lib/series-sync.ts` normalizes a source image URL
- **THEN** it SHALL call `normalizeSourceImageUrl` imported from `@repo/database`
- **AND** there SHALL be no local copy of this function in `series-sync.ts`
