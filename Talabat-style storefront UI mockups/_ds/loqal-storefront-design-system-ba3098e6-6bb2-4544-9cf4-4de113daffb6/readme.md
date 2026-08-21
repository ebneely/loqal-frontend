# Loqal Storefront Design System

Loqal is an Egyptian multi-brand marketplace for neighbourhood clothing shops. The
shop keeps its counter, its stock and — for cash and wallet orders — its money.
Loqal adds an online storefront, a shared catalogue and same-day delivery booked by
the shop itself. Talabat-shaped, not Amazon-shaped: the platform does not hold the
inventory and usually does not hold the cash.

**This system covers one product: the consumer storefront** — `shop.loqal.com`, the
shopper-facing half of the platform whose other half is the Loqal dashboard. Shoppers
and guests browse across shops, buy from several in one basket, pay by card, wallet,
Valu or cash on delivery, try a garment on with the AI try-on before buying, chat to
the shop, and track each shop's half of the order separately.

Phone first, literally: designed at 390px, then widened to 768 and 1024. The device
is a mid-range Android at full brightness in daylight, so contrast and hit size are
functional requirements, not taste.

The recruitment page at `join-loqaaal.vercel.app` is **reference only** — it is where
the wordmark, the voice and the colour discipline come from. It is not a deliverable
of this system and no kit recreates it.

Money is Egyptian pounds only, no currency selector anywhere. Arabic is the primary
language with true RTL; English is a toggle, not the source string.

The back-office consoles (brand / admin / sales) are a **separate** design system
that lives with `loqal-dashboard`. This one shares its colour, type, radius and
motion tokens on purpose — a storefront and a back office that disagree about what
"delivered" is coloured would be two products — but its type scale, layout rules and
component set are the storefront's own.

## Sources

Everything here traces to one of these. Nothing else was available.

- **`ebneely_loqal/`** — the attached monorepo, read-only.
  - `apps/loqal-backend/PRODUCT.md` — what Loqal is, who it is for, the register
    split, the voice, the constraints (Arabic-first, daylight legibility, the QR
    card, the contact number 01559959890).
  - `apps/loqal-backend/docs/user-stories.md` — **the storefront's screen
    inventory**: US-SHOP-001…019 (browse by shop, product, search, multi-shop cart,
    guest checkout, payment methods, tracking, returns, addresses).
  - `apps/loqal-backend/docs/superpowers/plans/2026-08-09-virtual-try-on-backend.md`
    — the try-on flow: person photo → subject, the variant's own garment photo, a
    queued render, ten renders per account for ever, cached against
    `(subject, variant, garmentMedia)`.
  - `apps/loqal-dashboard/src/app/globals.css` — **the only real token file in the
    repo.** Every colour, radius, shadow, easing and duration in `tokens/` is lifted
    from it verbatim.
  - `apps/loqal-dashboard/ClaudeDesignSystem/ds-icons.css` — the dashboard's own
    inlined Lucide masks; 33 of them are copied byte-for-byte into `assets/icons.css`.
  - `apps/loqal-dashboard/DESIGN-PROMPTS.md`, `DASHBOARD-SPEC.md` — order and return
    enum values, delivery routes, role rules.
  - `apps/loqal-frontend/` — **empty.** It contains a stub `package.json` and nothing
    else: no components, no CSS, no assets. The shopper storefront does not exist in
    code yet.
- **`https://join-loqaaal.vercel.app/`** — the live recruitment page, read for voice,
  wordmark spelling, and the garment/price examples. Its visual design could not be
  captured (text only), which is one reason nothing here traces it.
- The garments and prices used throughout (قميص كتان 450, تيشيرت أوفرسايز 390, هودي
  780, جاكيت 650, بنطلون جينز 1,150, فستان 890) and the shop names (Versattire, Dryp,
  Slack, Denjoe, Antikka, JEN) are the ones the live page shows.

Not available and not guessed: a Figma file (none exists), any storefront source
code, product photography, a logo file, font binaries.

## Content fundamentals

The storefront talks to a shopper; the join page talks to a shop owner. Both are
plain, direct and unembarrassed. Neither is startup-optimistic.

- **Arabic is the original, not a translation.** Egyptian Arabic phrasing where it
  reads more naturally than Modern Standard: "مش بتدفع حاجة", "بس كده", "برّه
  منطقتك". The English says the same thing in English — "if nothing sells, you pay
  nothing" — not the same words.
- **One language per session.** The storefront is Arabic by default with an English
  toggle in Account; it never shows both at once. (The recruitment page does show
  both, stacked — that is a marketing-surface pattern and deliberately not part of
  this system.) A Latin shop name inside an Arabic row is normal and handled by
  `unicode-bidi: plaintext`, not by translation.
- **Second person, present tense.** "إنت اللي بتطلب المندوب" / "You book the rider
  yourself". Loqal says what *you* do, not what *is done*.
- **Be concrete about money and effort.** "نسبة على الأوردر اللي بيتباع بس" beats any
  adjective. "الفورم مش بياخد أكتر من دقيقة." "مش محتاج تجهّز حاجة قبل الزيارة."
- **Say the consequence, not the caution.** "المحل بيراجع الرف قبل ما يأكد الأوردر"
  explains a wait instead of apologising for it. Never "Are you sure?".
- **Say what is absent and why**: "مصاريف التوصيل لكل محل لوحده — الأوردر من محلين
  بيتحسب مرتين." A missing thing explained is a feature.
- **Empty states describe what will appear**: "الحاجات اللي تختارها من أي محل تظهر
  هنا." — not "سلتك فاضية".
- **Sentence case everywhere.** Uppercase is reserved for 11px micro labels at 0.06em
  (`.lq-eyebrow`, a shop name over a product card) and for literal backend enum names
  when they are shown as facts.
- **Numbers are Latin digits, always** — even in Arabic, because Egyptian shoppers
  read money in Latin numerals. Shelf prices carry no decimals ("450 ج.م", exactly as
  the live page writes them); anything being reconciled — a total, a shipping fee, a
  refund — carries two. Currency is `ج.م` after the figure in Arabic, `EGP` before it
  in English.
- **Order numbers are readable over the phone** (`LQ-4821-7730`), because a guest
  looks an order up by number and phone with no account.
- **No emoji, ever.** No exclamation marks. No "Oops", no congratulation for
  completing a purchase. The only non-icon glyphs used as marks are `+` and `−`
  (U+2212) on money.

## Visual foundations

**Palette.** The neutral ramp untouched, plus one brand colour: emerald
`--primary: oklch(0.505 0.122 163)`. It is dark enough to hold white text at high
ambient brightness and saturated enough to survive a low-gamut Android panel, which
is the actual constraint. Everything structural is grey. A screen carries at most two
background values (`--surface-page` and `--surface-card`), plus `--surface-sunken`
for a photo well and `--surface-ink` for the marquee band and footer.

Six state tones cover every order enum as fg/bg/border triplets, so a pill needs no
opacity arithmetic: `neutral`, `wait`, `act` (the dot pulses), `live`, `good`, `bad`.
`good` **is** the brand emerald on purpose, and `live` is blue, so nothing green ever
means "still happening". Money has its own pair — `--money-credit` green,
`--money-debit` red — because a debit is not a failure.

**Type.** Readex Pro for both scripts: one family, matched x-height, drawn for
reading ease at small sizes, and its Arabic is a first-class design rather than a
fallback. At 700 with −0.03em tracking it is also the wordmark. Source Code Pro for
every figure — price, total, order number, phone number — tabular and lining, so a
column of prices lines up. Body is **16px here, not the back office's 14**: a shopper
reads sentences and prices at arm's length in sunlight; a shop owner scans a dense
table. The scale runs up to 48/72px for the join page's hero, which the back office
has no use for.

**Backgrounds.** Flat. No gradients, no illustration, no texture, no pattern. The
inverted ink band behind the marquee and the footer is the only non-white surface,
and the only "graphic" on the page is the ◆.

**Imagery.** There is none, and none has been invented. Every product photo is a
`--surface-sunken` tile at 3:4 with a Lucide `image` glyph. When real photography
arrives it will be brand-supplied phone photos taken inside the shop — warm, uneven,
mixed lighting — which is exactly why every frame around them is grey and every well
is the same ratio. No stock photography, no AI imagery, no illustration.

**Borders and elevation — hard offset, no blur.** A blurred grey shadow is invisible
on the device this product runs on: a mid-range Android at full brightness crushes an
8%-black 4px blur and the card reads as flat. So elevation is a **solid step of
colour cast off the corner** with zero blur — closer to a printed sticker or a riso
overprint than to Material. It survives sunlight, composites free on a cheap GPU, and
gives a press somewhere to land. Three rules make it a system:

1. **The step has a logical direction.** `--elev-dir` is `1` in LTR and `-1` under
   `[dir="rtl"]`, so the offset always falls away from the reading edge. Not one
   mirrored rule anywhere.
2. **Press lands the element in its own shadow.** An interactive surface translates by
   exactly its offset and drops its shadow to none, so the pixel that moves is the
   pixel under the finger. This replaces the old `scale(0.985)` — a shrink is a hint,
   landing on the page is an event.
3. **The step is tinted, never black.** Neutral surfaces cast `--elev-ink` (the
   foreground at 10%); the primary button casts `--shadow-key`, its own emerald
   darkened, so it reads as one solid object with a shadow of itself.

The scale: `--shadow-xs` 1px *seam* (it sits on the page — cards, inputs),
`--shadow-sm` 2px *step* (it is pressable — buttons, chips, payment rows),
`--shadow-md` 4px *lift* (hover on a pressable, and popovers), `--shadow-key` /
`--shadow-key-lift` for the brand button, and `--shadow-sheet` / `--shadow-bar`
stepping upward for the two sticky surfaces. **Blur is now reserved for exactly one
thing: the scrim behind a sheet.** If something is blurred, it is a scrim. No inner
shadows. No coloured left-border accents.

**Corner radii.** Everything derives from `--radius: 0.75rem`: chip 8, input and
button 10, card and photo well 12, sheet top corners 16, pills, swatches and avatars
fully round.

**Motion — thrown, then settled.** Everything leaves briskly and arrives slowly. The
house curve `--ease-out: cubic-bezier(.22,.72,.12,1)` takes a short beat to gather —
the first frames accelerate rather than jumping — then covers roughly 80% of its
distance by the halfway point and coasts almost to a standstill. That tiny wind-up is
what separates a thrown object from a teleported one; without it the motion reads as a
jump cut. The result is the iOS feel: the eye has already seen where the thing landed
long before it stops moving. Because the tail is long, the durations are longer than they look —
`--dur-fast` 140ms (press, hover, colour), `--dur-base` 260ms (sheet, disclosure,
select panel), `--dur-slow` 420ms (entrances, anything crossing the screen),
`--dur-settle` 560ms (the long coast: a status pill landing, a total recalculating).
A 420ms entrance still reads as instant.

`--ease-in` `cubic-bezier(.4,0,1,1)` is for exits only — leaving accelerates away
rather than coasting, so nothing lingers. `--ease-in-out` is only for a value
changing in place: colour, opacity, a width.

Every button press ripples from the touch point (520ms, `currentColor` at 32%) and
lands in its own shadow. A status pill, a cart count and a payment radio pop
`0.86 → 1.05 → 1`. A sheet slides up behind a fading scrim and back down on close. A
chat bubble and a list row rise 7px. The pulsing `act` dot and the loading skeleton
are the only loops. Nothing bounces past 1.05, nothing springs, there are no page
transitions, and all of it collapses under `prefers-reduced-motion: reduce`.

**Hover.** Filled buttons darken 12% via `color-mix` toward black — never a
lightening, never an opacity change. Ghost and secondary buttons take `--accent` as a
background. A linked card shifts its border toward the foreground and tints 3%. A
product photo scales 1.02 inside its well, and only there.

**Press.** The element translates by exactly its elevation offset and its shadow
disappears — it lands on the page. Cards also drop to `--accent`. That is the whole
press language; nothing scales.

**Focus.** `2px solid var(--ring)` at 2px offset, `--ring` being the brand emerald.
Fields also take a 3px 22%-alpha emerald ring on focus.

**Transparency and blur.** Three uses, no others: the 45%-black sheet overlay, the
92%-white top bar, and the 88%-white action bar and tab bar, each with a 10px
backdrop blur so content stays legible scrolling underneath. A translucent card over
dense content is unreadable in daylight.

**Layout.** Phone-first, literally: designed at 390px, then widened. Fixed elements
are the 56px sticky top bar, the 60px bottom tab bar (labels always visible), and the
sticky action bar carrying the one action of the screen in thumb reach — 44px is the
floor for anything tappable, 52px for that primary action. Content gutters are 16 /
24 / 32 by breakpoint. Unlike the back office, storefront content **is** centred, at
`--content-max: 1200px`, and prose measures `62ch`. The grid goes 2-up, 3-up at 768,
4-up at 1024 — via **container** queries, not media queries, so a 430px phone frame
embedded in a desktop page still lays out like a phone.

**RTL.** `dir="rtl"` is the only switch. Logical properties throughout — no `left`,
no `margin-left`, no per-screen mirroring. Chevrons and arrows mirror with
`scale(-1,1)`, never by swapping glyph. Titles and prose set
`unicode-bidi: plaintext`, so an English shop name inside an Arabic row keeps its own
punctuation and leading digits.

## Iconography

**Fluent UI System Icons** (Microsoft), the `*_24_regular` set, pinned to
`@fluentui/svg-icons@1.1.271`. They are filled rather than hairline-stroked,
optically rounded, and drawn on a 24px grid with generous corner radii — so they hold
their shape at 16px on a low-gamut panel in daylight, where a 2px stroke set thins
out and greys off. They also match the storefront's own geometry: the same round
corner language as `--radius` and the fully-round pills.

**FLAGGED SUBSTITUTION.** The codebase ships no icon assets of its own — the
dashboard imports `lucide-react` from `node_modules`, and there is no sprite, no icon
font and no SVG folder anywhere in the repo. Fluent is a deliberate choice for this
surface, not a copy of something that exists, and it is a **known divergence from the
back office**, which still renders Lucide. If both consoles ever appear in one
screenshot they will mix icon sets; the fix is to move the dashboard too, not to
un-pick this.

- Every glyph is **inlined as a data-URI CSS mask** in `assets/icons.css`, so it
  inherits `currentColor` and needs no per-colour variant. Nothing loads from a CDN at
  runtime: a mask fetched from a URL renders as a solid black square in
  DOM-rasterising screenshot tools, which is what every thumbnail here is captured
  with.
- Keys keep the familiar Lucide naming the components already use
  (`data-icon="heart"`, `"shopping-bag"`, `"trash-2"`, `"scan-face"`), so swapping the
  set again is one file and no component changes.
- Sizes: 16 in buttons and list rows, 18 standalone, 20 in the tab bar and empty
  states, 24 on the try-on affordance.
- Chevrons and directional arrows mirror under `[dir="rtl"]` with `scale(-1,1)`, never
  by swapping glyph.
- An icon is never the only label on a money or destructive action.
- **No emoji.** No Unicode characters used as icons.
- `guidelines/brand-icons.card.html` is the full house set.

## Brand assets

**There is no logo.** None exists in the repo or on the live page as a file, and none
has been drawn. Wherever a mark would go, the word is set in Readex Pro 700 at
−0.03em: `Loqal` in the storefront's top bar, `لوكال` in Arabic-only contexts
(`LOQAAAL` is the recruitment page's own spelling and stays there). See
`guidelines/type-wordmark.card.html`. `assets/` therefore holds only `icons.css`.

## Fonts

Readex Pro and Source Code Pro load from Google Fonts by `@import` in
`tokens/fonts.css`. **No font binaries were supplied**, so there are no `@font-face`
rules with local `src:` targets and the compiler reports zero fonts. If Loqal has
licensed files, drop them into `assets/fonts/`, replace the `@import` with real
`@font-face` rules, and nothing else changes.

## Index

| Path | What it is |
|---|---|
| `styles.css` | The one file consumers link. `@import` lines only. |
| `tokens/` | `fonts.css`, `colors.css`, `typography.css`, `spacing.css`, `elevation.css`, `base.css` |
| `assets/icons.css` | Every Lucide glyph, inlined as a CSS mask |
| `css/components.css` | The `lq-*` class layer the components render into. Logical properties and container queries only. |
| `components/core/` | Icon, Button, IconButton, Input, Textarea, Select, Checkbox, Badge, Card, Skeleton |
| `components/commerce/` | Money, RollingNumber, ProductCard, BrandTab, VariantPicker, QuantityStepper, StatusPill (+ `StatusTones`), CartLine, PaymentOption |
| `components/navigation/` | TopBar, BottomTabBar, SearchField, CategoryTabs |
| `components/overlays/` | Sheet, ActionBar |
| `components/chat/` | ChatBubble |
| `ui_kits/storefront/` | The consumer app: home, search, product, try-on, bag, checkout, order, orders, chat, account. `index.html` (phone) and `desktop.html`. |
| `ui_kits/ds-loader.js` | Boots a kit from `_ds_bundle.js`, falling back to the component sources before the first compile. |
| `guidelines/` | 18 specimen cards: colours, type, spacing, radii, elevation, motion, RTL, icons, wordmark. |
| `SKILL.md` | Agent-skill entry point. |
| `thumbnail.html` | The system's tile. |

### Components

ActionBar, Badge, BottomTabBar, BrandTab, Button, Card, CartLine, CategoryTabs,
ChatBubble, Checkbox, Icon, IconButton, Input, Money, PaymentOption, ProductCard,
QuantityStepper, RollingNumber, SearchField, Select, Sheet, Skeleton, StatusPill,
TopBar, Textarea, VariantPicker.

Each has a sibling `.d.ts` (the props contract) and `.prompt.md` (what it is, when to
use it, a usage example).

### Intentional additions

No component library exists in the codebase for this surface — `apps/loqal-frontend`
is empty — so the inventory here is derived from the storefront user stories rather
than copied from a source. Four entries are worth naming explicitly:

- **`Select`** — a trigger plus popover listbox in the shape of shadcn/ui's Select,
  which is the library the dashboard is built on. **There is no native `<select>`
  anywhere in this system**: the OS wheel cannot be styled, cannot carry a second line
  of Arabic, and looks like a different product on every Android skin. Same reasoning
  applies to every other control — nothing user-facing is a raw HTML widget.
- **`ChatBubble`** — the shopper side of the chat module that already exists in the
  backend (and as `bubble.tsx` in the dashboard). Chat is where a shop confirms a
  shelf check, so it is a commerce surface, not a social one.
- **`RollingNumber`** — a figure that counts in the direction it moved instead of
  swapping. Quantity and any total the shopper watches recalculate go through it; a
  shelf price never does, because the motion is a claim that *this number just moved*.
- **`Icon`** — a wrapper over the Fluent masks, needed because this system has no
  bundler and loads glyphs as CSS masks.
- **`StatusTones`** (exported from `StatusPill.jsx`) — the enum → tone + bilingual
  label map, so a screen can read the wording instead of inventing it.

Deliberately **not** built, because nothing on this surface needs it: Dialog (there is
no centred modal — everything is a bottom sheet), Toast, Tooltip, Table, Accordion,
Rating (reviews are a *Later* story and not in the schema), Wishlist screens
(post-traction), promo-code UI (a *Later* story), and the whole recruitment-page
register (`Bilingual`, `Marquee`, the ◆ list) which was built and then removed when
the landing page came out of scope.

## Open questions

1. The storefront has no design source at all beyond the user stories, so its screens
   are a **proposal**, not a recreation. Where a story left a decision open (the
   shipping-fee split on a multi-shop order, the return window, whether search gets
   facets) the screens follow the story's MVP note and say so in words.
2. The Arabic UI strings are meaning-first, not a reviewed localisation. They need a
   native speaker's pass before shipping.
3. The per-shop shipping figure (45 ج.م), the try-on wording, and the stock-note
   phrasing are placeholders to confirm against the backend.
4. **Icon-set divergence**: this system is Fluent, the dashboard is Lucide. Decide
   whether the dashboard moves too.
