# Storefront design mockups

Static HTML mockups of the shopper-facing storefront. **Not** part of the Next.js
app — nothing here is imported, compiled or served by it. `tsconfig.json` excludes
this folder the same way it already excludes the Talabat canvas beside it.

```bash
cd design
node serve.mjs 4400     # http://127.0.0.1:4400
```

| page | |
|---|---|
| `index.html` | the shop — category rail, shop rail, product grid |
| `search.html` | results with the filter rail (shop, size, colour, price) |
| `product.html` | product detail — scrolling gallery, sticky info column |
| `categories.html` | الأقسام |
| `shops.html` | المحلات, filtered by neighbourhood and open/closed |
| `basket.html` | السلة, split by shop |

## The screen board

`storefront-screens.html` is one self-contained file holding EVERY screen at
once — the replacement for `Loqal Storefront Screens.dc.html`, which is the
board for the old register and is now out of date. Open it directly, no server
and no build.

Fourteen screens: twelve phone frames at a real 390×844, and two WEB pages.
The web ones are not phone screens made wide — they have no fixed height and
run to the end of the document, footer included, because that is what a browser
shows. The phone frames clip at 844 because a device does.

It is drawn from the app's own `src/app/tokens.css`, not re-picked by eye. When
the register moves, this file moves with it.

`app.css` and `app.js` are shared by every page. The header brands menu, the
footer, the shop card and the shop data are all built once in `app.js` and
injected — duplicating any of them per page is how the advertise site lost the
same fix twice.

## Colour

Stone and ink come from the landing page (`join-loqaaal.vercel.app`); green comes
from the `.dc` design system, which `loqal-dashboard` also uses.

```
--paper  #EDEBE5   --ink   #14130F
--green  #007950   go: available, open, confirmed, add to cart   (4.55:1 on stone)
--signal #C8102E   stop: a price cut, or a failure. Nothing else.
```

Type is Readex Pro, one family across Arabic and Latin, per the `.dc` system.

## Placeholder content

Shop names, neighbourhoods, prices and counts are invented. The garments are drawn
SVG because there is no product photography yet — in a real shop the photographs
carry the grid, and these drawings should survive only in the category strip where
they work as icons.
