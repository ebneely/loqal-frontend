/**
 * The garment line art.
 *
 * THERE IS NO PRODUCT PHOTOGRAPHY, and none has been invented. Every well in
 * the storefront is a 3:4 hairline frame with one of these drawings in it. When
 * real photography arrives it will be brand-supplied phone photos taken inside
 * the shop — warm, uneven, mixed lighting — which is exactly why every frame
 * around them is grey and every well is the same ratio.
 *
 * Ported from `design/app.js`, where the same twelve paths were a global
 * `SHAPES` object that four static pages read by key. One module, imported;
 * there is no second copy to drift from this one.
 *
 * Drawn on a 120x120 viewBox with a 1px stroke. A few paths carry `data-solid`
 * and fill at 7% — the drawings are flat outlines otherwise and a page of them
 * reads as a wireframe rather than as a catalogue.
 */

export const GARMENT_KINDS = [
  "tee",
  "shirt",
  "knit",
  "sweat",
  "pants",
  "shorts",
  "jacket",
  "shoe",
  "bag",
  "cap",
  "dress",
  "socks",
] as const;

export type GarmentKind = (typeof GARMENT_KINDS)[number];

export const isGarmentKind = (value: string): value is GarmentKind =>
  (GARMENT_KINDS as readonly string[]).includes(value);

/**
 * Every product needs a drawing and the API does not say which garment a
 * product is, so the kind is derived from the product's own identity rather
 * than picked at random: the same product gets the same drawing on the grid,
 * on the card and on the shop page, across reloads and across users.
 *
 * A hash, not `Math.random()` and not an array index — an index would repaint
 * the whole grid when one product is inserted, and random would give the same
 * product two drawings on two screens.
 */
export function garmentFor(seed: string): GarmentKind {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  }
  return GARMENT_KINDS[Math.abs(hash) % GARMENT_KINDS.length];
}

/**
 * A CATEGORY IS NOT UNKNOWN, and hashing one was a bug.
 *
 * `garmentFor` above is right for a product, for the reason its own note gives:
 * the API never says which garment a product is, so a stable arbitrary drawing
 * is the honest answer. A category is the opposite case — "أحذية" IS a shoe —
 * and running it through the same hash put a beanie on عبايات, a sock on شنط
 * and a t-shirt on أحذية. Every tile on the shelf read as nonsense, on the one
 * screen whose entire job is to say what these shops sell.
 *
 * So categories are looked up, not hashed. Keyed on the SLUG, which is the
 * stable identifier — the name is bilingual free text an admin can edit, and a
 * shop renaming a category must not silently change its drawing.
 *
 * The five seeded slugs, plus their parent, plus the identity mappings for
 * every kind that shares a name with a drawing. Anything else falls through to
 * `garmentFor`, so a category nobody anticipated still renders a garment rather
 * than a blank cell.
 */
const CATEGORY_GARMENTS: Record<string, GarmentKind> = {
  /* The live five, and the parent above them. */
  clothes: "tee", // the broadest tile there is; the tee is the plainest drawing
  /* No abaya drawing exists and one has not been invented. `dress` is the
     closest silhouette in the set — full length, cut from the shoulder — and a
     long dress standing in for an abaya is a near miss, where the hash's beanie
     was simply wrong. It is the first drawing to add when there is one. */
  abayas: "dress",
  dresses: "dress",
  tops: "shirt",
  bags: "bag",
  shoes: "shoe",

  /* Identity: a slug that names one of the twelve drawings gets that drawing.
     Both spellings where Egyptian shops use both. */
  tees: "tee",
  "t-shirts": "tee",
  tshirts: "tee",
  shirts: "shirt",
  knitwear: "knit",
  knits: "knit",
  sweatshirts: "sweat",
  hoodies: "sweat",
  pants: "pants",
  trousers: "pants",
  shorts: "shorts",
  jackets: "jacket",
  coats: "jacket",
  outerwear: "jacket",
  caps: "cap",
  hats: "cap",
  socks: "socks",
};

/**
 * The drawing for a category tile. Use this wherever a `Category` picks its
 * art — never `garmentFor` directly, which is the products' function.
 */
export function categoryGarment(slug: string): GarmentKind {
  return CATEGORY_GARMENTS[slug.trim().toLowerCase()] ?? garmentFor(slug);
}

const SHAPES: Record<GarmentKind, React.ReactNode> = {
  tee: (
    <path d="M40 26 L30 34 L22 52 L34 58 L38 50 L38 96 L82 96 L82 50 L86 58 L98 52 L90 34 L80 26 L70 26 Q60 38 50 26 Z" />
  ),
  shirt: (
    <>
      <path d="M42 24 L30 32 L22 52 L33 58 L37 50 L37 98 L83 98 L83 50 L87 58 L98 52 L90 32 L78 24 L60 34 Z" />
      <path d="M60 34 L60 98" />
      <path d="M42 24 L60 34 L78 24" />
      <rect data-solid x="66" y="50" width="12" height="14" />
    </>
  ),
  knit: (
    <>
      <path d="M44 26 L26 36 L18 60 L30 66 L36 54 L36 98 L84 98 L84 54 L90 66 L102 60 L94 36 L76 26 Q60 34 44 26 Z" />
      <path d="M44 26 Q60 20 76 26" />
      <path d="M36 90 L84 90" />
    </>
  ),
  sweat: (
    <>
      <path d="M44 26 L26 36 L18 60 L30 66 L36 54 L36 98 L84 98 L84 54 L90 66 L102 60 L94 36 L76 26 Z" />
      <path d="M46 26 Q60 40 74 26" />
      <path data-solid d="M36 92 L84 92 L84 98 L36 98 Z" />
      <path d="M30 92 L90 92" />
    </>
  ),
  pants: (
    <>
      <path data-solid d="M40 20 L80 20 L84 62 L78 104 L64 104 L60 60 L56 104 L42 104 L36 62 Z" />
      <path d="M40 20 L80 20 L84 62 L78 104 L64 104 L60 60 L56 104 L42 104 L36 62 Z" />
      <path d="M40 30 L80 30" />
    </>
  ),
  shorts: (
    <>
      <path d="M38 24 L82 24 L86 56 L80 84 L64 84 L60 56 L56 84 L40 84 L34 56 Z" />
      <path d="M38 34 L82 34" />
    </>
  ),
  jacket: (
    <>
      <path d="M42 22 L28 30 L20 56 L32 62 L36 52 L36 102 L84 102 L84 52 L88 62 L100 56 L92 30 L78 22 Z" />
      <path d="M60 22 L60 102" />
      <path d="M42 22 L60 30 L78 22" />
      <rect x="40" y="62" width="14" height="16" />
      <rect x="66" y="62" width="14" height="16" />
    </>
  ),
  shoe: (
    <>
      <path data-solid d="M18 78 Q20 58 40 56 L72 56 Q98 58 100 78 L100 86 L18 86 Z" />
      <path d="M18 78 Q20 58 40 56 L72 56 Q98 58 100 78 L100 86 L18 86 Z" />
      <path d="M40 56 L46 68 L74 68" />
    </>
  ),
  bag: (
    <>
      <path d="M34 44 L86 44 L92 100 L28 100 Z" />
      <path d="M46 44 L46 32 Q60 20 74 32 L74 44" />
      <path d="M28 58 L92 58" />
    </>
  ),
  cap: (
    <>
      <path d="M32 74 Q32 34 60 34 Q88 34 88 74 Z" />
      <path data-solid d="M28 74 L92 74 L92 88 L28 88 Z" />
      <path d="M28 74 L92 74 L92 88 L28 88 Z" />
    </>
  ),
  dress: (
    <>
      <path d="M46 24 L38 34 L30 100 L90 100 L82 34 L74 24 Q60 34 46 24 Z" />
      <path d="M38 48 L82 48" />
    </>
  ),
  socks: (
    <>
      <path d="M46 24 L62 24 L62 66 L84 84 L72 98 L44 76 L44 24 Z" />
      <path d="M46 34 L62 34" />
    </>
  ),
};

/**
 * `aria-hidden` always. These are decoration standing in for a photograph, not
 * information: the product name and price beside them carry every fact, and a
 * screen reader announcing "tee shirt drawing" on a product called
 * "تيشيرت قطن — أوف وايت" reads the same word twice.
 */
export function Garment({
  kind,
  className,
}: {
  kind: GarmentKind;
  className?: string;
}) {
  return (
    <svg
      className={className}
      viewBox="0 0 120 120"
      aria-hidden="true"
      focusable="false"
    >
      {SHAPES[kind]}
    </svg>
  );
}
