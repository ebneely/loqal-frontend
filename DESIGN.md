# Design

Visual system for the Loqal consumer storefront (`shop.loqal.com`). Strategic
context lives in `PRODUCT.md`; this file is how it looks.

Two prior artefacts feed it and they disagreed. The disagreement is now
resolved, in writing, so nothing re-litigates it:

| | source | verdict |
|---|---|---|
| surface, structure, chrome | `design/` static mockups | **canon** |
| brand hue, state tones, icon set, figures | `.dc` design system + `_ds/` | **canon** |
| structural reference | suuupply.com | reference only, never copied |

`design/` supplies the ground, the hairline, the grain, the page shape. The
`.dc` system supplies `--green`, the six state tones, the Fluent masks and the
Latin-figures rule. Where they conflicted the table above decides.

## Theme

**Light only.** No dark mode, and the scene forces it: a mid-range Android at
full brightness, held outdoors in Egyptian daylight. A dark UI in that light is
a mirror. There is no night-time use case worth a second palette on a shopping
surface people open on the street.

**Stone, not white.** `#EDEBE5` at 3% SVG grain. Two reasons it is not the AI
warm-neutral reflex: it is inherited from a live surface
(`join-loqaaal.vercel.app`) rather than invented, and it is doing structural
work — the hairline system needs a ground the 1px `--line` can sit on without
either disappearing or reading as a box. On white, `#CFCBC0` is a smudge.

## Color

Hex, not OKLCH, and deliberately: these values are inherited verbatim from two
shipped surfaces. Converting them would silently move them.

```css
--paper:  #EDEBE5;   /* body ground */
--raise:  #F5F4F0;   /* a band that lifts off the ground: strips, sign panels */
--field:  #F7F6F3;   /* input interior */
--line:   #CFCBC0;   /* the 1px. The whole structural system is this colour */
--ink:    #14130F;   /* primary text — 15.1:1 on paper */
--ink-2:  #605F5A;   /* secondary text — 5.13:1 on paper */
--ink-3:  #757470;   /* 3.75:1 — LARGE TEXT AND NON-ESSENTIAL ONLY */

--green:      #007950;   /* oklch(.505 .122 163) — 4.55:1 on paper */
--green-soft: #DDEBE3;
--green-line: #A8C9B8;
--signal:     #C8102E;   /* 4.70:1 on paper */
--signal-soft:#F7E3E5;
```

**Never set text colour with `opacity`.** `opacity:.55` on ink over stone is
3.75:1 and fails AA for body. That is what `--ink-2` exists for. Opacity is for
non-text only.

### The colour rule, which outranks the hex values

```
GREEN = go     available, open now, confirmed, add to cart, focus ring,
               cart badge, checked filter, primary button
RED   = stop   a price that dropped, and something that failed. Nothing else.
```

Red carrying focus rings or status dots reads as alarm. `--green` stays
`#007950` because `loqal-dashboard` uses it: a storefront and a back office that
disagree about the colour of "delivered" are two products.

**Strategy: Restrained.** One accent under 10% of surface. Everything
structural is `--line` and `--ink`.

### Order-status tones

The six `.dc` tones, re-grounded on stone. `good` **is** the brand green on
purpose; `live` is blue so nothing green ever means "still happening". Each pill
carries a word — colour is never the only carrier.

| tone | use | fg | bg | border |
|---|---|---|---|---|
| neutral | draft, cancelled | `#4A4945` | `#E6E4DD` | `#CFCBC0` |
| wait | placed, awaiting shelf check | `#6B5310` | `#F2EBD8` | `#DCCC9E` |
| act | needs the shopper | `#8A3413` | `#F6E6DC` | `#E0BFA8` |
| live | out for delivery | `#1F4F8F` | `#DFE8F4` | `#A9C2E0` |
| good | confirmed, delivered | `#007950` | `#DDEBE3` | `#A8C9B8` |
| bad | failed, returned | `#A5122A` | `#F7E3E5` | `#E2B4BB` |

Signed money keeps its own pair: `--money-credit #007950`, `--money-debit
#A5122A`. A debit is not a failure, which is why it is not the `bad` tone.

## Typography

**Readex Pro**, 200–700, one family across Arabic and Latin. Matched x-height,
so an Arabic price row and a Latin one are the same height in the same grid, and
its Arabic is a first-class design rather than a fallback. At 700 / −0.03em it
is also the wordmark — there is no logo file and none has been drawn.

**Source Code Pro**, 400–800, every figure: price, total, order number, phone,
piece count, date. Tabular and lining, so a cart total lines up under a
subtotal.

Both self-hosted via `next/font`, not the design system's
`@import url(fonts.googleapis.com)` — that import is render-blocking and costs a
DNS lookup and a connection on Egyptian mobile data.

**Numerals are Latin, always**, in both languages. `450 ج.م`. Egyptian shoppers
read money in Latin numerals, and an order number has to be readable over the
phone (`LQ-4821-7730`). A shelf price carries no decimals; anything being
reconciled — a total, a fee, a refund — carries two.

Currency: `ج.م` after the figure in Arabic, `EGP` before it in English.

**Scale.** Fixed rem, not fluid — this is product UI read at consistent DPI.
Ratio ~1.2. Body 16px, because a shopper reads sentences and prices at arm's
length in sunlight.

```
11  micro label      600  0.06em   the ONLY uppercase in the system, Latin only
13  caption          300
14  small / meta     300
16  body             400          prose measures 62ch
20  section title    400  -0.022em
26  page title       400  -0.025em
34  display          300  -0.03em  the shop sign, the wordmark
```

**Never apply `letter-spacing` or `text-transform:uppercase` to Arabic.**
Uppercase is a no-op on Arabic and tracking pulls a cursive script apart. The
11px micro label is Latin-only for exactly this reason.

Sentence case everywhere else. No emoji, ever. No exclamation marks.

## Space & Layout

Gutters `clamp(1rem, 3.5vw, 3rem)`. Content centres at `--content-max: 1200px`;
prose caps at 62ch.

**Hairline grids.** Cells share borders — a `gap:1px` grid over a `--line`
background, with a 1px outer border. Not `border` per cell, which double-draws
every interior edge.

**Radius: 0. Shadow: none.** Everywhere, no exceptions. Depth is carried by the
1px line and by `--raise`. This is the single largest divergence from the `.dc`
system, which specifies hard-offset elevation and 8-12px radii; `design/` wins
per the table at the top of this file.

No gradients. No glassmorphism. The one translucent surface is the sticky
header, `color-mix(in srgb, var(--paper) 90%, transparent)` + 14px blur, so
content stays legible scrolling underneath.

Grids: 2-up phone, 3-up at 768, 4-up at 1024, via **container** queries — a
430px phone frame embedded in a desktop page still lays out like a phone.

## Chrome

| | phone `<720px` | desktop `>=720px` |
|---|---|---|
| top | 56px bar: wordmark + search | util strip + sticky header: wordmark, centred search, الأقسام, المحلات (mega), cart |
| bottom | 60px tab bar, 5 slots, **labels always visible** | none |
| footer | none — `/account` carries the same links | dark `#141310`, three columns |

Labels in the tab bar are never hidden. An icon alone is a guess.

## Iconography

**Fluent UI System Icons**, `*_24_regular`, `@fluentui/svg-icons@1.1.271`,
inlined as data-URI CSS masks so every glyph inherits `currentColor` and nothing
is fetched at runtime. Filled and optically rounded, so they hold shape at 16px
on a low-gamut panel where a 2px hairline stroke greys off.

Sizes: 16 in buttons and list rows, 18 standalone, 20 in the tab bar and empty
states. Chevrons mirror under `[dir="rtl"]` with `scale(-1,1)`, never by
swapping glyph. An icon is never the only label on a money or destructive
action.

**Known divergence:** this surface is Fluent, `loqal-dashboard` is Lucide.

## Imagery

**There is none, and none has been invented.** No product photography exists.
Garments are hand-drawn SVG line art on the stone ground — 1px stroke, a few
paths filled at 7% for rhythm — in twelve keys: `tee shirt knit sweat pants
shorts jacket bag shoe cap dress socks`.

When real photography arrives it will be brand-supplied phone photos taken
inside the shop: warm, uneven, mixed lighting. That is why every frame around
them is a hairline and every well is 3:4.

No stock photography. No AI imagery. No illustration beyond the garment set.

## Motion

Long ease-out only. Nothing bounces, nothing springs, there are no page
transitions.

```css
--ease: cubic-bezier(.16, 1, .3, 1);   /* the house curve */
--slow: cubic-bezier(.22, 1, .36, 1);  /* entrances */
```

- press / hover / colour — 140ms `--ease`
- sheet, disclosure, mega panel — 260ms `--ease`
- entrances — 420ms `--slow`, staggered 70ms

Reveals are `IntersectionObserver` adding a class to already-visible content.
Content is **never** gated on a transition firing — transitions pause on hidden
tabs and never run in headless renderers, and a gated section ships blank.

Everything collapses under `prefers-reduced-motion: reduce`.

## Components

Every interactive component ships default, hover, focus, active, disabled,
loading, error. Loading is a skeleton, never a spinner in the middle of content.
Empty states teach the interface — they describe what will appear, never the
emptiness.

- **Focus:** `2px solid var(--green)` at 2px offset. Fields also take a 3px 22%
  green ring.
- **Hover:** filled buttons darken 12% toward black — never lighten, never an
  opacity change. Linked cards shift border toward ink and tint 3%.
- **Press:** background to `--raise`. Nothing scales, nothing moves.
- **No native `<select>`** anywhere: the OS wheel cannot be styled, cannot carry
  a second line of Arabic, and looks like a different product on every Android
  skin. Same for every other control.
- **No centred modal.** Everything is a bottom sheet.

## RTL

`dir="rtl"` is the only switch. Logical properties throughout — no `left`, no
`margin-left`, no per-screen mirroring, not one mirrored rule anywhere. Titles
and prose set `unicode-bidi: plaintext` so a Latin shop name inside an Arabic
row keeps its own punctuation and leading digits.
