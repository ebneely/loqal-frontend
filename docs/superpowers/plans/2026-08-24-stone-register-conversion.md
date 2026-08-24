# Stone Register Conversion — Implementation Plan

**Goal:** Convert the Next.js storefront from the `.dc` white/elevated register to
the `design/` stone/hairline register, then build out toward the 28 screens the
`.dc` board specifies.

**Architecture:** One token file and one component layer carry the whole system;
every screen is composition, not CSS. Chrome is one component with two layouts
chosen by a container query. Shop data, garment art and status tones are single
modules rendered in many places.

**Tech Stack:** Next 16.3.2 (App Router), React 19, Tailwind 4 (utilities only —
the `lq-*` layer is hand-written CSS), TanStack Query, zod contracts.

## Global Constraints

- Register decided in `DESIGN.md`. `design/` wins surface, structure, chrome;
  `.dc` wins `--green #007950`, the six state tones, Fluent masks, Latin figures.
- Radius 0, shadow none, everywhere. Depth is the 1px `--line` and `--raise`.
- Text colour is never set with `opacity`. Use `--ink`, `--ink-2`, `--ink-3`.
- Never `letter-spacing` or `text-transform` on Arabic. 11px micro label is
  Latin-only.
- Numerals Latin in both languages. `ج.م` trails in Arabic, `EGP` leads in English.
- Logical properties only. `dir="rtl"` is the only RTL switch.
- Every animation collapses under `prefers-reduced-motion: reduce`. Reveals
  enhance already-visible content; never gate visibility on a transition.
- Contrast: body >=4.5:1, large >=3:1. Verified, not assumed — the stone ground
  makes this tighter than white does.
- Commit after each numbered point. No `Co-Authored-By` trailer.

## The API gap that shapes phases 4-5

`publicBrandSchema` (`src/contracts/storefront.contract.ts`) carries exactly
`id, slug, name, logoUrl, coverUrl, description`.

It does **not** carry neighbourhood, street, opening hours, piece count or an
open/closed flag — the five fields the shop-sign card and the neighbourhood
filter are built from, and the thing `PRODUCT.md` calls the product's premise.
`design/app.js` invented all of them in a hardcoded `SHOPS` array.

Consequence, and it is not negotiable around: **the components take these fields
and render only what the API answers.** No placeholder neighbourhood ships. A
shop card with no location renders name + description and nothing else, and
`/shops` shows no neighbourhood filter until the field exists. Closing the gap
is a backend task; it is named here so nobody re-invents the array.

Same class of gap, already known and already handled: `searchResultSchema` has no
cover and no stock flag, so search renders a list, not product cards.

---

## Phase 1 — Foundation

The token layer and the base layer. Nothing renders differently until Phase 2,
but everything after this depends on it.

**Files:**
- Rewrite: `src/app/tokens.css` — stone palette, state tones re-grounded, type
  scale, motion curves. Delete the verbatim `.dc` copy and the header telling
  future readers not to hand-tune it.
- Rewrite: `src/app/globals.css` — reset, base, grain overlay, focus, reveal,
  `prefers-reduced-motion`, container setup.
- Keep: `src/app/icons.css` unchanged. Fluent masks inherit `currentColor` and
  are register-neutral.

**Done when:** `npm run build` passes and the existing 7 routes render on stone
with hairlines, unstyled in places. Ugly is expected here; broken is not.

## Phase 2 — Chrome

**Files:**
- Rewrite: `src/components/shell.tsx` — util strip + sticky header + mega menu
  trigger + footer at `>=720px`; 56px bar + 60px tab bar below it. One `TABS`
  array rendered twice.
- Create: `src/components/brands-menu.tsx` — A-Z mega panel, feature pane that
  follows the hovered shop, 60ms open / 220ms close delay, Escape and scrim
  close, `mouseover` **and** `focus` update the pane (the `design/` version
  updates on hover only, so keyboard users get a frozen pane).
- Create: `src/components/site-footer.tsx` — dark, three columns, drawn payment
  glyphs. Desktop only; `/account` carries the same links on phone.

**Done when:** chrome renders at 390 / 768 / 1024, RTL and LTR, keyboard-navigable,
and the mega panel is not clipped by any `overflow` ancestor.

## Phase 3 — Primitives

**Files:**
- Create: `src/components/garment.tsx` — the twelve SVG keys, ported from
  `design/app.js`. One `<Garment kind="tee" />`, no per-page copy.
- Create: `src/components/money.tsx` — Source Code Pro, tabular, Latin, decimals
  only when the figure is being reconciled.
- Create: `src/components/status-pill.tsx` — enum to tone + bilingual label, so a
  screen reads the wording instead of inventing it. Colour is never the only
  carrier.
- Create: `src/components/reveal.tsx` — `IntersectionObserver` hook adding `.in`
  to already-visible content.
- Rewrite: `src/components/product-card.tsx` on the hairline well.

## Phase 4 — Re-skin the 7 routes

`/`, `/search`, `/shop/[brand]`, `/shop/[brand]/[product]`, `/bag`, `/orders`,
`/account`. Class swaps and layout, no new data. `/search` gains the filter
**rail** (never a sheet on desktop); `/shop/[brand]/[product]` gains the sticky
info column and the mobile buy bar.

## Phase 5 — `/categories` and `/shops`

Both exist in `design/` and the mega menu, home rail and footer already link at
them. Gives every shop card a real destination instead of one shared index.
Neighbourhood filter renders only if the API gap above is closed first.

## Phase 6 — The flows (separate plan)

Checkout with the rider step, order placed, per-shop tracking, chat, returns,
addresses, favourites, offers. Each needs endpoints wired, not CSS. Audit
`cart.contract.ts`, `order.contract.ts` and `return.contract.ts` for what exists
before planning; write it as its own plan file.
