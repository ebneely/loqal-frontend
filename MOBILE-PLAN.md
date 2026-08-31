# Mobile web, properly

Most shoppers will open Loqal on a phone browser — Chrome or Safari on
Android and iPhone, not an app. The phone layout is therefore the primary
design, not a narrowed desktop one.

## What is already true (verified, do not rebuild it)

The responsive layer EXISTS and works. It is written with **`@container`, not
`@media`** — `.lq-shell` carries `container-type:inline-size` and there are
thirteen `@container` blocks. Anyone grepping for `@media` will wrongly
conclude the app has no breakpoints. It does.

The chrome switch at `components.css:876` already hides the phone bars above
720px and the desktop header below it. That works. Leave it alone.

## What is missing

1. **No hamburger.** Every destination that is not a tab is unreachable on a
   phone except through `/account`.
2. **The tab bar is missing the two things a shop is for** — products and
   shops. It currently carries Home, Search, Bag, Orders, Account.
3. **Content overflows at 390px.** The hero's secondary link is clipped at the
   right edge in a real screenshot.

## References the user gave

`jlood.com` is the closest target: hamburger + wordmark + icon row, a search
field under it, category chips, a two-up product grid, and a five-slot tab bar
whose second slot is Products. Also `noon.com/egypt-en` and `amazon.co.uk`.

## The tab-bar decision

Seven tabs do not fit. At 390px each slot would be ~50px and unreadable.
Search already has a permanent affordance in the phone top bar, so it does not
need a slot of its own, and Account is exactly what a hamburger is for.

```
Tab bar (5)   Home · Products · Shops · Bag · Orders
Hamburger     Account, categories, language, help, the footer links
Top bar       wordmark, search, and the hamburger trigger
```

Every destination stays reachable. Nothing is lost; two things move.

## Global constraints

- **Arabic-first with true RTL.** Use logical properties — `inset-inline`,
  `padding-inline`, `margin-block` — never `left`/`right`. A drawer that
  slides from the left in Arabic is wrong.
- **Do not restyle the desktop.** Above 720px the app must look exactly as it
  does today. Every rule you add is inside a container query, or scoped to a
  class that only the phone chrome uses.
- Reuse the existing tokens in `tokens.css` — spacing, colour, radius,
  duration. Do not introduce new hex values or magic pixel numbers.
- Icons come from `icons.css` via `<span class="lq-icon" data-icon="…">`.
  Check what exists before inventing one.
- `npx tsc --noEmit` is currently CLEAN. Keep it that way.
- The drawer must be keyboard-usable: focus moves into it, Escape closes it,
  focus returns to the trigger. It must respect `prefers-reduced-motion`.
- Tap targets 44px minimum. This is a phone in daylight, not a mouse.

## Task A — the phone chrome (owns `shell.tsx`, a new drawer, a new stylesheet)

Files: `src/components/shell.tsx`, a new `src/components/nav-drawer.tsx`,
a new `src/app/mobile-chrome.css` imported after `components.css`.

**Do not edit `components.css`.** Another task owns it. Put every rule you
need in the new stylesheet.

- Add the hamburger to `.lq-topbar` as the leading control, with the wordmark
  centred or leading and search trailing — follow the reference.
- Build the drawer: slides in from the inline-start edge, a scrim behind it,
  closes on scrim click, Escape, and on navigation.
- Contents: Account, Categories, Shops, language switch, and the links the
  desktop footer carries. Read `site-footer.tsx` for what those are rather
  than inventing them.
- Rework `TABS` to the five above. Products points at the products/categories
  route that exists — check the routes in `src/app` and use a real one.
- The bag badge behaviour stays as it is.

## Task B — content at phone widths (owns `components.css`)

Files: `src/app/components.css` only, plus page components if a fix genuinely
needs markup.

**Do not edit `shell.tsx` or create files in `src/components`.** Task A owns
those.

- Find and fix horizontal overflow at 360px and 390px. The hero's secondary
  link is clipped; there will be more. Long Arabic and English strings must
  wrap or truncate, never push the page sideways.
- The product grid should read as two columns on a phone, the way the
  reference does, and the cards should stay legible at that size.
- Check every page: home, search, categories, shops, product, bag, checkout,
  orders, account. A page that is never opened on a phone still should not be
  broken.
- Respect the tab bar: content must not sit underneath it. There is a
  `--tabbar-height` token.

## Verification

Both tasks: `npx tsc --noEmit` and `npm run lint` must pass.

The dev server runs on **IPv6 only** — `http://[::1]:3000`, NOT
`127.0.0.1:3000`, which is refused. That is not a bug to fix; just use the
right host.
