# Product

## Register

product

Design SERVES the product. A shopper is in a task — find a garment, check it is
really on the shelf, pay, track two shops' halves of one order. The storefront
is not a campaign; `join-loqaaal.vercel.app` is the campaign and is out of scope.

## Users

**The shopper.** Egyptian, Cairo or Giza, on a mid-range Android at full
brightness in daylight. Reads Arabic first. Buys clothes from neighbourhood
shops she could walk to, and half the reason she trusts the order is that the
shop has an address on a street she knows. Often a guest — no account, looks an
order up by number and phone.

The job: find a garment from a shop near her, know whether it is actually on the
shelf, buy from more than one shop in one go, and know when each shop's half
arrives.

**Not a user of this surface:** the shop owner. That is `loqal-dashboard`, a
separate product with its own design system.

## Product Purpose

Loqal is a marketplace for neighbourhood clothing shops. Talabat-shaped, not
Amazon-shaped: the shop keeps its counter, its stock and — for cash and wallet
orders — its money. Loqal adds the online storefront, the shared catalogue, and
same-day delivery the shop books itself.

Success is a shopper buying from a shop she had never walked into, and the
garment arriving the same day from that shop's own shelf.

## Brand Personality

**Plain, local, unembarrassed.** Never startup-optimistic.

- Arabic is the original, not a translation. Egyptian colloquial where it reads
  more naturally than Modern Standard.
- Second person, present tense. "إنت اللي بتطلب المندوب."
- Concrete about money and effort. A number beats an adjective.
- Say the consequence, not the caution. "المحل بيراجع الرف قبل ما يأكد الأوردر"
  explains a wait instead of apologising for it. Never "Are you sure?".
- Say what is absent and why. A missing thing explained is a feature.
- Empty states describe what will appear, never the emptiness.
- No emoji, no exclamation marks, no congratulation for completing a purchase.

## Anti-references

- **Amazon / Noon.** Infinite aisle, warehouse logistics, a seller you never
  locate. Loqal's premise is the opposite: the shop is a place on a street.
- **Talabat's visual register.** Its *shape* is right — address first, shop
  rails, one basket across vendors, a status per vendor. Its look is not:
  saturated orange, rounded cards, stacked promo banners, drop shadows.
- **Marketplace theatre.** Countdown timers, "12 people viewing", fake scarcity,
  star ratings the schema cannot answer.
- **Glassmorphism, gradient text, hero-metric templates, identical card grids.**
- **A tiny tracked uppercase eyebrow above every section.** Uppercase is
  meaningless on Arabic and tracking breaks the cursive join.

## Design Principles

1. **The shop is a place.** Neighbourhood and street are content, not metadata.
   Where the API can answer them they lead the card; where it cannot, the screen
   says nothing rather than inventing a location.
2. **Never claim stock we do not own.** The figure is a copy of what the shop
   last said; the shop checks the shelf before confirming. The copy says so.
3. **Split what the backend splits.** One `BrandOrder` per shop, each with its
   own delivery, fee and status. A single combined ETA promises something the
   system does not do.
4. **Legible in daylight before it is elegant.** Contrast and hit size are
   functional requirements on this device, not taste.
5. **Build it once.** Chrome, shop card, garment art and shop data are one
   module rendered many places. The same block in two files is how a fix gets
   lost.

## Accessibility & Inclusion

- WCAG 2.2 AA. Body text ≥4.5:1; the stone ground makes this tighter than white
  does, so every pair is checked rather than assumed.
- Pinch-zoom is never disabled. Someone reads a garment description on a 390px
  screen in sunlight.
- 44px minimum hit target; 52px for the primary action of a screen.
- True RTL by `dir` alone — logical properties throughout, no mirrored rules.
  `unicode-bidi: plaintext` on titles so a Latin shop name in an Arabic row
  keeps its own punctuation.
- Every animation collapses under `prefers-reduced-motion: reduce`. Reveals
  enhance already-visible content; nothing is gated on a transition firing.
- Colour is never the only carrier of state. Open/closed, sale and order status
  each carry a word.
