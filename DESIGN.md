---
name: loqaaal storefront
description: Neighbourhood clothing shops, presented like a serious fashion house. Arabic first, RTL first.
colors:
  paper: "#ffffff"
  raise: "#f3f3ef"
  line-hair: "#e2e2dc"
  line-ink: "#c9cac1"
  ink: "#121311"
  ink-2: "#55574f"
  ink-3: "#75776e"
  green: "#0b3d2e"
  green-2: "#145a45"
  green-soft: "#e9f1ec"
  green-line: "#cfe3d6"
  on-green-2: "#c6dacd"
  signal: "#a5122a"
  signal-soft: "#fbe6e9"
  state-neutral-fg: "#45473f"
  state-neutral-bg: "#f3f3ef"
  state-neutral-border: "#e2e2dc"
  state-wait-fg: "#7a5000"
  state-wait-bg: "#fbf0d9"
  state-wait-border: "#f0dcae"
  state-act-fg: "#8a3413"
  state-act-bg: "#f9e8de"
  state-act-border: "#ecc9b4"
  state-live-fg: "#1f4f8f"
  state-live-bg: "#e3ecf7"
  state-live-border: "#bcd0ea"
  state-good-fg: "#0b3d2e"
  state-good-bg: "#cfe3d6"
  state-good-border: "#b3d3be"
  state-bad-fg: "#a5122a"
  state-bad-bg: "#fbe6e9"
  state-bad-border: "#efc0c8"
typography:
  display:
    fontFamily: "Reem Kufi, Alexandria, Segoe UI, system-ui, sans-serif"
    fontSize: "clamp(3rem, 1.6rem + 6vw, 7rem)"
    fontWeight: 500
    lineHeight: 1.1
    letterSpacing: "0"
  headline:
    fontFamily: "Reem Kufi, Alexandria, Segoe UI, system-ui, sans-serif"
    fontSize: "clamp(2.5rem, 1.6rem + 3.6vw, 4.5rem)"
    fontWeight: 500
    lineHeight: 1.15
    letterSpacing: "0"
  title:
    fontFamily: "Reem Kufi, Alexandria, Segoe UI, system-ui, sans-serif"
    fontSize: "clamp(1.875rem, 1.4rem + 1.6vw, 2.875rem)"
    fontWeight: 500
    lineHeight: 1.25
    letterSpacing: "0"
  body:
    fontFamily: "Alexandria, Noto Sans Arabic, Tahoma, sans-serif"
    fontSize: "1rem"
    fontWeight: 300
    lineHeight: 1.65
    letterSpacing: "0"
    fontFeature: "\"tnum\" 1, \"lnum\" 1"
  lede:
    fontFamily: "Alexandria, Noto Sans Arabic, Tahoma, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 300
    lineHeight: 1.65
  label:
    fontFamily: "Alexandria, Noto Sans Arabic, Tahoma, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: "0"
  figure:
    fontFamily: "Alexandria, Segoe UI, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 500
    letterSpacing: "0"
    fontFeature: "\"tnum\" 1, \"lnum\" 1"
rounded:
  none: "0px"
  full: "9999px"
spacing:
  "1": "4px"
  "2": "8px"
  "3": "12px"
  "4": "16px"
  "5": "20px"
  "6": "24px"
  "8": "32px"
  "10": "40px"
  "12": "48px"
  "16": "64px"
  "20": "80px"
  "24": "96px"
  pad: "clamp(1rem, 3.4vw, 3rem)"
  section-gap: "clamp(3.75rem, 9vh, 7rem)"
  tap-min: "44px"
  tap-primary: "52px"
components:
  button-primary:
    backgroundColor: "{colors.green}"
    textColor: "{colors.paper}"
    rounded: "{rounded.none}"
    padding: "0 24px"
    height: "44px"
  button-primary-hover:
    backgroundColor: "{colors.green-2}"
  button-primary-large:
    backgroundColor: "{colors.green}"
    textColor: "{colors.paper}"
    rounded: "{rounded.none}"
    padding: "0 32px"
    height: "52px"
  button-secondary:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "0 24px"
    height: "44px"
  button-secondary-hover:
    backgroundColor: "{colors.raise}"
  button-onbrand:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.green}"
    rounded: "{rounded.none}"
  button-onbrand-hover:
    backgroundColor: "{colors.green-line}"
  button-disabled:
    backgroundColor: "{colors.line-hair}"
    textColor: "{colors.ink-2}"
  input:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.none}"
    padding: "12px 16px"
    height: "48px"
  search-field:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.lede}"
    rounded: "{rounded.none}"
    height: "52px"
  chip:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "0 16px"
    height: "46px"
  chip-selected:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
  badge-drop:
    backgroundColor: "{colors.signal}"
    textColor: "{colors.paper}"
    rounded: "{rounded.none}"
    padding: "2px 8px"
  badge-count:
    backgroundColor: "{colors.green}"
    textColor: "{colors.paper}"
    rounded: "{rounded.full}"
    height: "18px"
  footer-band:
    backgroundColor: "{colors.green}"
    textColor: "{colors.paper}"
  feature-band:
    backgroundColor: "{colors.green}"
    textColor: "{colors.paper}"
---

# Design System: loqaaal storefront

Strategic context lives in `PRODUCT.md`; this file is how the storefront looks.
`src/app/tokens.css` holds the values, and the frontmatter above is the
normative copy of them. The token *names* in `tokens.css` are inherited from the
previous register (`--paper`, `--raise`, `--line-*`); only the values changed.

## Overview

**Creative North Star: "The Neighbourhood Fashion House"**

Neighbourhood shops, presented the way a serious fashion house presents a
collection: a white wall, near-black type, photographs given room, and one deep
bottle green that takes whole bands of the page instead of being sprinkled as
accents. The shop is still a place on a street. The presentation just stops
looking like a delivery app.

The structure is lines, not boxes. Rows sit on 1px hairlines, grids share
their seams, and a card is almost never a bordered rectangle. The type does the
shouting: Reem Kufi set very large, like a shop sign, on page titles, section
heads, shop names and the big list rows, with Alexandria at weight 300 for
everything a shopper reads or taps. Corners are square everywhere. Depth exists
only on the few things that really float over the page.

Visual rejections, confirmed by the owner: the cream-plus-serif look, the
stone-plus-grain look this storefront used before, rounded cards, soft
decorative gradients, and Talabat's saturated orange, promo-banner register.

**Key Characteristics:**
- White ground, near-black ink, one bottle green that owns whole regions.
- Square corners; round only for things that are round by nature.
- Hairline rules instead of boxes; shared-seam grids.
- Reem Kufi display set huge; Alexandria 300 body; tabular Latin figures.
- Red means a price drop or a failure. Nothing else.
- Shadows only on what floats: the inset hero photo, menus, sheets.
- RTL by `dir` alone; layout by container queries on `.lq-shell`.

## Colors

A white and near-black wall with a single deep green that takes over whole
bands, and red held back for two meanings.

### Primary
- **Bottle Green** (`green`): the brand. Owns whole regions: the featured-shop
  band, the footer, the primary button, the home hero plate before its photo
  loads, a shop's hero when it has no photo. Also the cart count, a checked
  box, the selected payment radio, the active thumbnail bar, text selection.
  White on it is 12.4:1.
- **Green, Lifted** (`green-2`): hover on anything green, and green used *as
  text* on white (8.4:1): open-now status, a hovered shop name or big-list
  row, the focus ring, the focused field edge.
- **Green Wash** (`green-soft`): the background of a chosen option (selected
  payment row, the hovered category shelf).
- **Mint** (`green-line`): on the green band only. The huge closing wordmark,
  footer column heads, the feature band's monogram, the hover on a white
  on-brand button. Also the confirmed-tag fill (`state-good-bg`).
- **Mint Muted** (`on-green-2`): secondary text on the green band (8:1+).

### Tertiary
- **Signal Red** (`signal`): a price that dropped, and something that failed.
  The drop badge is the one place it is a fill. `signal-soft` is its wash for
  error surfaces.

### Neutral
- **Paper** (`paper`): the page, every sheet, menu, and bar. White because
  photography is the product and white is the only ground that does not tint a
  garment.
- **Shelf** (`raise`): the one step off white. An image well before its photo
  lands, a skeleton, a hover wash on quiet rows and tiles, a disabled option.
- **Hairline** (`line-hair`): the 1px between rows, the seam colour of shared
  grids, the disabled button slab.
- **Field Edge** (`line-ink`): an input's border and any hairline that has to be
  found (popover edge, range track, scrollbar).
- **Ink** (`ink`): titles and body text (18.6:1). Also the fill of a selected
  chip or filter tab, and the 2px rule on the search field and sheet top.
- **Ink Secondary** (`ink-2`): meta, captions, counts, struck prices (7.4:1).
- **Ink Quiet** (`ink-3`): placeholders and the quietest text allowed (4.6:1).

### Order-status tones

Six tones, one per order stage, each fg / bg / border in the frontmatter
(`state-*`). Every tag also carries a word.

| tone | used for |
|---|---|
| neutral | draft, cancelled |
| wait | placed, awaiting shelf check |
| act | needs the shopper (its dot pulses) |
| live | out for delivery (blue, so nothing green ever means "still happening") |
| good | confirmed, delivered (the brand green on purpose) |
| bad | failed, returned |

Signed money: credit is `green-2`, debit is `signal`, zero is `ink-2`. A debit
is not a failure, which is why it is not the `bad` tone.

### Named Rules

**The Whole Band Rule.** Green arrives as a region (a band, a plate, a filled
button), never as scattered accent text, icons or borders. If a screen has
green confetti on it, it is wrong.

**The Go / Stop Rule.** GREEN = go: available, open now, confirmed, add to
cart, focus ring, cart count, checked filter, primary action. RED = stop: a
price that dropped, and something that failed. Nothing else. A red focus ring or
cart badge reads as an error on the one control the shopper is meant to use.

**The No-Opacity Text Rule.** Text colour is never set with `opacity`. Use
`ink-2` or `ink-3`. A disabled row steps its title to muted colour; it does not
fade.

## Typography

**Display Font:** Reem Kufi (falls back to Alexandria, then Segoe UI)
**Body Font:** Alexandria (with Noto Sans Arabic, Tahoma under RTL)
**Figures:** Alexandria with tabular lining numerals (not a monospace)

Both are self-hosted through `next/font`, with Arabic and Latin subsets. A
Google Fonts stylesheet would block rendering and cost a connection on Egyptian
mobile data.

**Character:** Reem Kufi is a geometric Kufi that reads as a shop sign at 90px
and still sets Latin; Alexandria at 300 is calm and light under it, and its
figures are the prices.

### Hierarchy
- **Hero** (Reem Kufi 500, `clamp(84px, 14cqi, 216px)`, 1): the home heading
  only. One line in Arabic; English drops to two lines at `clamp(56px, 8.4cqi, 136px)`.
- **Display** (Reem Kufi 500, 1.1): a shop's name on its own page
  (`clamp(58px, 10cqi, 150px)`), the featured shop's name, the index page titles
  (`clamp(46px, 7.4cqi, 108px)`).
- **Big row** (Reem Kufi 500, `clamp(36px, 6cqi, 88px)`, 1.2): area and
  category names in the big list. Phone: `clamp(26px, 8.2cqi, 44px)`.
- **Headline** (Reem Kufi 500, 1.15): a page title (`lq-pagetitle`), and the
  product name at `clamp(2.125rem, 3.8vw, 3.375rem)`.
- **Title** (Reem Kufi 500, 1.25): section heads. Shop-card names at 28px and
  the sheet title at 22px also use the display face.
- **Lede** (Alexandria 300, 18px, 1.65): the sentence under a title, capped at
  62ch. The hero lede is 19px.
- **Body** (Alexandria 300, 16px, 1.65): everything read. Prose caps at 62ch.
- **Label** (Alexandria 400, 14px): nav links (15px), chips, meta, captions
  (13px). 12px is the floor, for badges and counts only.
- **Figure** (Alexandria 500, tabular lining): prices, totals, order numbers,
  phones, counts, dates.
- **Wordmark** (Reem Kufi 700): `loqaaal` in the header (34px desktop, 28px
  phone), on the once-per-session opening, and set at `clamp(5rem, 21cqi, 22rem)`
  in mint to close the footer, cut by the screen's bottom edge.

Headings `h1`, `h2` take the display face by default; an `h3` stays in
Alexandria unless its component says otherwise.

### Named Rules

**The Shop Sign Rule.** Reem Kufi is for names and titles set large. Never
for body text, labels, buttons or prices.

**The Untracked Arabic Rule.** Never letter-space or uppercase Arabic. Tracking
pulls a cursive script apart at the joins and uppercase does nothing to it.
Every tracking token in the system is 0.

**The Latin Figures Rule.** Numerals are Latin in both languages, always
tabular and lining. `450 ج.م` in Arabic, `EGP 450` in English. A shelf price has
no decimals; anything being reconciled (a total, a fee, a refund) has two. An
order number must be readable over the phone (`LQ-4821-7730`).

**The Brand Name Rule.** The brand is written `loqaaal`, in Latin letters, in
every language. The wordmark is set `direction: ltr` so an RTL page does not
reverse it.

Sentence case everywhere. No emoji, no exclamation marks. Arabic copy is Modern
Standard Arabic.

## Layout

One horizontal inset everywhere: `pad`, `clamp(1rem, 3.4vw, 3rem)`. Content
centres at 1440px; prose caps at 62ch. Sections are separated by
`section-gap` (`clamp(3.75rem, 9vh, 7rem)`), not by rules or boxes.

Photographs often go edge to edge: the home feed bleeds past the gutter, the
featured-shop band and shop hero are full width, and grids of pictures use 3px
gaps with 24-40px between rows, so pictures read as a wall and captions sit
under them on white.

Grids: product feed 2 / 3 / 4 columns at 720 / 1024; the home feed's first
item spans two columns and two rows. Shop grid 1 / 2 / 3. Hairline grids
(`.lq-pgrid`, `.lq-tiles`, `.lq-rows`) share their seams.

**Chrome.** Below 720px: a 60px top bar (menu, wordmark, search) and a 62px
bottom tab bar with labels always visible; a drawer slides from the inline
start. From 720px: a 72px three-column header (destinations at the inline
start, the wordmark centred, tools at the inline end), a brands mega panel, no
tab bar. The green footer shows at every width.

Hit targets: 44px minimum, 52px for the primary action of a screen. A "small"
button is small in padding and type, never in target.

### Named Rules

**The Container Rule.** Layout switches are container queries on `.lq-shell`
(`container-type: inline-size`), never width media queries. A 430px phone frame
embedded in a desktop page must still lay out like a phone. The chrome switch
is 720; wide is 1024.

**The Logical Properties Rule.** `dir="rtl"` is the only switch. Logical
properties throughout (`inset-inline-start`, `margin-inline-end`,
`border-block-end`), no `left`/`right`, not one mirrored rule. Directional
icons mirror with `scale(-1, 1)` under RTL. Titles and paragraphs set
`unicode-bidi: plaintext` so a Latin shop name in an Arabic row keeps its own
punctuation.

## Elevation & Depth

Flat by default. Structure is hairlines and the white-to-shelf step. A shadow
belongs only to something that really floats over the page, and it is soft and
long, never a hard offset step.

### Shadow Vocabulary
- **Float** (`0 26px 44px -22px rgb(0 0 0 / 0.5)`): the small inset photo
  straddling the home hero's plate edge.
- **Menu** (`0 24px 48px -24px rgb(11 20 16 / 0.32)`): the brands mega panel
  and the select popover.
- **Sheet** (`0 -20px 40px -24px rgb(11 20 16 / 0.3)`): a bottom sheet, cast
  upward.

The overlay behind menus and sheets is `rgb(11 20 16 / 0.45)`; the phone drawer
scrim adds a 2px backdrop blur. Photographs carrying white text get a
legibility veil: a flat 26% ink veil on the home hero plate, and a scrim that
darkens upward into the green on a shop's hero. Those are the only gradients.

### Named Rules

**The Only-What-Floats Rule.** If it does not sit above other content, it has
no shadow. Cards, rows, buttons, tiles and grid cells never cast one, and
nothing moves on press.

## Shapes

Square corners everywhere (`rounded.none`): buttons, inputs, chips, badges,
cards, image wells, sheets, menus. The radius tokens are literal `0px`, never a
`calc()` off a zero base, which resolves negative and is silently dropped.

Round (`rounded.full`) is kept for things that are round by nature: status
dots, the cart count, colour swatches, the radio dot, the range thumb, the
sheet grab handle.

Image wells are 3:4 for garments, 4:5 for the product page's main image, 4:3
for shop cards. Underlines do the work of borders on search fields, text links
and the footer subscribe field.

### Named Rules

**The Square Rule.** A rounded rectangle anywhere is a regression.

**The Shared Hairline Rule.** Grid cells share borders: a 1px gap over a
`line-hair` background, closed top and bottom. Never a border per cell, which
draws every interior edge twice.

## Components

Every interactive component ships default, hover, focus, active, disabled,
loading and error. Loading is a skeleton, never a spinner over content. Empty
states describe what will appear.

### Buttons
- **Shape:** square, 44px tall (52px large), medium weight, no shadow, never
  moves on press. Colour is the whole response.
- **Primary:** bottle green, white text, 24px inline padding; hover lifts to
  `green-2`.
- **Secondary:** white with a 1px ink border; hover takes the shelf wash.
- **Ghost:** ink text, no border; hover takes the shelf wash.
- **On brand:** on the green band, a white slab with green text; hover goes mint.
- **Destructive:** signal red, darkened 14% toward black on hover.
- **Disabled:** a flat hairline-grey slab with `ink-2` text, never a faded green.
- **Text link:** underlined at rest with a 1px rule in `currentColor`; hover
  turns `green-2`.

### Chips and filter tabs
- **Style:** square, 1px hairline border, white, 14px label; 46px tall for size
  chips, 40px for filter and category tabs.
- **State:** hover darkens the border to ink; selected fills with ink and white
  text. A sold-out size is struck through on the shelf colour.

### Badges and status tags
- **Badges:** square, 13px medium. The drop badge is solid red; brand, tint and
  neutral variants exist. The cart count is the one round badge, green.
- **Status pill:** square, 1px border in the tone's border colour, a 6px round
  dot, always a word.

### Cards / Containers
- **Corner Style:** square.
- **Background:** white; image wells on the shelf colour until a photo lands.
- **Shadow Strategy:** none (see Elevation).
- **Border:** usually none. Product and shop cards are a picture with a caption
  under it on white. A boxed card (`lq-card`) is a 1px hairline square, rare.
- **Hover:** the photo grows to 1.04 inside its well over the settle duration;
  a shop card's name turns `green-2` and a row of 2px ticks steps through its
  photos.

### Inputs / Fields
- **Style:** square, 48px, 1px `line-ink` border, white, 16px weight 300.
- **Focus:** the border turns `green-2` and thickens to 2px with an inset 1px
  ring, so the field never grows.
- **Error:** border in signal red, with a red hint line in words.
- **Search field:** no box. A 52px field over a 2px ink underline, 18px text
  (22px on the search page); focus turns the underline `green-2`.
- **Select:** never native. A trigger the height of an input opens a square
  popover with the menu shadow and a check on the chosen item.

### Navigation
- **Desktop header:** 15px Alexandria 400 links. Hover and the current page
  draw a 1px underline from the inline start, never a colour change. The
  language switch is two square buttons sharing a seam; the active one is filled.
- **Home:** the header lies over the hero, transparent with no rule. The
  wordmark and tools sit on the photo and turn white; the destinations sit on
  white and stay ink.
- **Phone:** top bar plus a bottom tab bar; the current tab is `green-2`, heavier,
  with a 2px bar on its top edge. Labels are never hidden.
- **Footer:** the green band: four columns on mint-muted text, white links that
  underline on hover, an underlined subscribe field, then the huge mint
  wordmark.

### Home hero (signature)
The photograph owns the inline-end 57% (`--hero-split`). The heading «متاجر
حيّك» starts at the inline start and crosses onto the photo; an aria-hidden
white copy clipped to the plate makes it turn from ink to white exactly at the
photo's edge. The lede, the underlined search and the category links sit at the
inline-start bottom. From 1024px a small 3:4 inset photo with the float shadow
straddles the plate edge. The plate photo settles from 1.12 to 1.04 scale on
load. On a phone it stacks: heading, full-width photo, lede, search, links.

### Big list rows (signature)
Areas on home and the categories index: each row is a name in huge display
type on a hairline, with its count at the inline end. From 720px, hover or
focus opens a thumbnail beside the name *by width* (0 to
`clamp(130px, 14cqi, 200px)`, 550ms) and turns the row `green-2`. It never
chases the cursor. On a phone the thumbnail is always shown at the row start.

### Featured shop band (signature)
A full-width green band, photo on one side and the shop's name in display type
on the other, with a facts row (bold value over a quiet note, three across)
on a translucent white rule.

### Bottom sheet
No centred modals; everything is a bottom sheet. White, a 2px ink rule on top,
the sheet shadow, slides up over 280ms.

### Motion
One curve, `cubic-bezier(0.22, 1, 0.36, 1)`: covers its distance early and
coasts. 160ms for hover and colour, 280ms for panels and disclosures, 550ms for
reveals and the widening thumbnail, 1100ms for a photo settling. Reveals play
on content that is already visible; nothing is gated on a transition firing.
Everything collapses under `prefers-reduced-motion: reduce`.

### Iconography
Fluent UI System Icons, `*_24_regular`, inlined as CSS masks in `currentColor`.
16px in buttons and rows, 18px standalone, 21-22px in the tab bar and header
tools. An icon is never the only label on a money or destructive action.

## Do's and Don'ts

### Do:
- **Do** give green whole regions: the featured band, the footer, the primary button.
- **Do** separate content with 1px hairlines and section spacing, not boxes.
- **Do** set titles, shop names and big rows in Reem Kufi, large.
- **Do** set body in Alexandria 300 and every figure tabular and lining, in Latin numerals.
- **Do** keep every pair at WCAG 2.2 AA: body text 4.5:1 or better, `ink-3` (4.6:1) is the floor.
- **Do** keep hit targets at 44px, 52px for the screen's primary action.
- **Do** carry state with a word as well as a colour.
- **Do** switch layout with container queries on `.lq-shell` and write logical properties only.
- **Do** focus with a 2px `green-2` outline at 3px offset.
- **Do** write the brand as `loqaaal`, and Arabic copy in Modern Standard Arabic.

### Don't:
- **Don't** round a corner, except the round-by-nature set in Shapes.
- **Don't** put a shadow on anything that does not float, and never a hard offset shadow.
- **Don't** use red for anything but a price drop or a failure.
- **Don't** letter-space or uppercase Arabic, and don't put a small tracked label above a section.
- **Don't** set text colour with opacity.
- **Don't** use a decorative gradient; the only gradient is a legibility scrim over a photograph.
- **Don't** return to stone and paper grain, cream with a serif, rounded cards, or Talabat orange.
- **Don't** use a native `<select>`, a centred modal, or a spinner over content.
- **Don't** use a width media query for layout, or `left`/`right` properties.
- **Don't** disable pinch-zoom.
