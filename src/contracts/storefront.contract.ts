import { z } from 'zod';
import { bilingualSchema, moneySchema } from './contracts';
import { ProductStatusSchema } from './enums';

/**
 * The shopper's view of the catalogue.
 *
 * ONE RULE SHAPES THE WHOLE FILE: a shopper is told WHETHER something is
 * available, never HOW MANY are left. `CatalogService.toPublicShape` strips
 * `stockOnHand` off every variant and replaces it with a boolean, and these
 * schemas are `.strict()` so a regression that lets the count through fails
 * here rather than printing a competitor's inventory on a product page.
 *
 * Separate from `catalog.contract.ts`, which is the dashboard's file. The two
 * describe the same rows and deliberately not the same fields.
 */

/**
 * Paged, not cursored — and that is the API's choice, not a preference.
 *
 * The back office uses cursors because a brand works a list by clearing rows
 * off the top of it. A shopper browsing a shop is reading a stable catalogue
 * and expects page 2 to still be page 2, so `GET /v1/brands/:slug/products`
 * answers with `page`/`perPage`/`total` and the storefront pages the same way.
 */
export const publicPageSchema = <T extends z.ZodTypeAny>(item: T) =>
  z
    .object({
      items: z.array(item),
      total: z.number().int().min(0),
      page: z.number().int().min(1),
      perPage: z.number().int().min(1),
    })
    .strict();

export const listPublicProductsQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    perPage: z.coerce.number().int().min(1).max(60).default(24),
    categoryId: z.string().uuid().optional(),
  })
  .strict();
export type ListPublicProductsQuery = z.infer<typeof listPublicProductsQuerySchema>;

/**
 * A variant as a shopper may see it.
 *
 * `inStock` replaces the dashboard's `stock` object outright. The design system
 * says the shelf note is words, not a figure ("آخر قطعتين" is a brand's claim,
 * not ours), so nothing here carries a number to print.
 */
export const publicVariantSchema = z
  .object({
    id: z.string().uuid(),
    sku: z.string(),
    /** Free-form key/value — size, colour. Not a fixed taxonomy. */
    attributes: z.record(z.string(), z.string()),
    price: moneySchema,
    /**
     * The struck-through "was" price. The API refuses a value at or below
     * `price` with a 409 — a discount that is not a discount is a lie printed
     * next to a number.
     */
    compareAtPrice: moneySchema.nullable(),
    inStock: z.boolean(),
  })
  .strict();
export type PublicVariant = z.infer<typeof publicVariantSchema>;

export const publicProductSchema = z
  .object({
    id: z.string().uuid(),
    slug: z.string(),
    name: bilingualSchema.nullable(),
    status: ProductStatusSchema,
    basePrice: moneySchema.nullable(),
    categoryId: z.string().uuid().nullable(),
    coverUrl: z.string().url().nullable(),
    variantCount: z.number().int(),
    /** Cheapest live variant. What a card actually prints. */
    priceFrom: moneySchema.nullable(),
    /**
     * Whether ANY variant is sellable, computed from AVAILABILITY (on-hand
     * minus live reservations), never from on-hand alone. Five on the shelf
     * with four held at checkout is not "in stock", and a boolean that is
     * wrong in the optimistic direction is worse than no boolean, because a
     * shopper acts on it.
     */
    inStock: z.boolean(),
    updatedAt: z.string().datetime(),
  })
  .strict();
export type PublicProduct = z.infer<typeof publicProductSchema>;

export const publicProductPageSchema = publicPageSchema(publicProductSchema);
export type PublicProductPage = z.infer<typeof publicProductPageSchema>;

export const publicProductDetailSchema = publicProductSchema
  .extend({
    description: bilingualSchema.nullable(),
    variants: z.array(publicVariantSchema),
    mediaUrls: z.array(z.string().url()),
  })
  .strict();
export type PublicProductDetail = z.infer<typeof publicProductDetailSchema>;

/**
 * A shop, as the storefront lists and opens it.
 *
 * There is no rating and no review count, because reviews are a *Later* story
 * and are not in the schema — a card that reserved space for stars would be
 * promising something the API cannot answer.
 */
export const publicBrandSchema = z
  .object({
    id: z.string().uuid(),
    slug: z.string(),
    name: z.string(),
    logoUrl: z.string().url().nullable(),
    coverUrl: z.string().url().nullable(),
    description: bilingualSchema.nullable(),

    // -- The rest of what the public plane actually sends ---------------------
    //
    // These were missing, and their absence was not harmless: the schema is
    // strict, so eight unexpected keys made the whole page fail to parse and
    // the storefront rendered "we cannot reach the shops" against a healthy
    // API. A contract that describes less than the wire is not stricter, it
    // is broken.
    //
    // The ids are kept beside the URLs rather than replaced by them. The URL
    // is presigned and expires; the id is what a client uses to ask for a
    // fresh one, and it is what the dashboard plane speaks in.
    logoMediaId: z.string().uuid().nullable(),
    coverMediaId: z.string().uuid().nullable(),
    deliveryFee: moneySchema.nullable(),
    minimumOrderValue: moneySchema.nullable(),
    returnWindowDays: z.number().int(),

    /**
     * Loose on purpose. A new delivery route is a value this list gains before
     * any storefront ships that knows the name, and an enum here would turn
     * that release into a blank shop list — the exact failure this block was
     * written to fix.
     */
    supportedDelivery: z.array(z.string()),

    // Placement we sold has to be labelled wherever it renders.
    isPromoted: z.boolean(),
    featuredUntil: z.string().nullable(),
  })
  .strict();
export type PublicBrand = z.infer<typeof publicBrandSchema>;

export const publicBrandPageSchema = publicPageSchema(publicBrandSchema);
export type PublicBrandPage = z.infer<typeof publicBrandPageSchema>;

/**
 * A flat category list, not a tree.
 *
 * `GET /v1/categories` answers `listFlat()`, and the storefront's category
 * strip is one row of chips — nesting it would be inventing a level the
 * screen has nowhere to draw.
 */
export const publicCategorySchema = z
  .object({
    id: z.string().uuid(),
    slug: z.string(),
    name: bilingualSchema,
    parentId: z.string().uuid().nullable(),
  })
  .strict();
export type PublicCategory = z.infer<typeof publicCategorySchema>;

export const publicCategoryListSchema = z.array(publicCategorySchema);

/**
 * The parameter is `query`, not `q` — and the DTO is `.strict()`, so sending
 * `q` is a 400 rather than an ignored key. `perPage` caps at 50 here, not 60.
 */
/**
 * The four orders search can answer.
 *
 * `relevance` is the default and the only one the trigram rank means anything
 * for. There is no "الأقرب لي" — that needs a shop location, and no schema in
 * this repo carries one.
 */
export const searchSortSchema = z.enum([
  "relevance",
  "priceAsc",
  "priceDesc",
  "newest",
]);
export type SearchSort = z.infer<typeof searchSortSchema>;

export const searchProductsQuerySchema = z
  .object({
    query: z.string().trim().min(1).max(200),
    page: z.coerce.number().int().min(1).default(1),
    perPage: z.coerce.number().int().min(1).max(50).default(20),

    /** Brand SLUGS, from the facets this endpoint returns. */
    brands: z.array(z.string()).max(20).optional(),
    /**
     * Matched against the variant's own `attributes` — free text a shop typed,
     * with no size or colour taxonomy anywhere in the schema to validate
     * against. The API compares case-insensitively for the same reason.
     */
    sizes: z.array(z.string()).max(20).optional(),
    colors: z.array(z.string()).max(20).optional(),
    /** Inclusive, and read against the VARIANT price — `basePrice` is display
     *  only, and a size XL can cost more than an S. */
    priceMin: z.number().min(0).optional(),
    priceMax: z.number().min(0).optional(),
    inStockOnly: z.boolean().optional(),
    sort: searchSortSchema.optional(),
  })
  .strict();
export type SearchProductsQuery = z.infer<typeof searchProductsQuerySchema>;

/**
 * SEARCH STILL ANSWERS A DIFFERENT SHAPE, and this is not a tidiness problem.
 *
 * `/v1/search/products` is a raw trigram similarity query over Product joined
 * to Brand, and it now left-joins the variants so it can filter and price. It
 * carries `priceFrom`, `compareAtPrice` and `inStock`.
 *
 * IT STILL HAS NO `coverUrl` AND NO `total`. The cover needs a presigned media
 * URL per row, which is a second pass over every match; the count is not a
 * meaningful number over a similarity search and costs another query. So a
 * search result is STILL not a `PublicProduct` and still cannot be rendered by
 * anything that assumes one — reusing `publicProductPageSchema` here, which is
 * what this app did at first, fails to parse every response, and `.strict()`
 * is what turns that into an error at the boundary rather than an undefined
 * price three components away.
 *
 * `hasMore` rather than `total`: the API fetches one extra row instead. A
 * screen can offer "more" and cannot offer "page 7 of 12".
 */
export const searchResultSchema = z
  .object({
    id: z.string().uuid(),
    slug: z.string(),
    name: bilingualSchema.nullable(),
    /** Nullable: an ACTIVE product may still have no price set. */
    basePrice: moneySchema.nullable(),
    brandId: z.string().uuid(),
    brandName: z.string(),
    brandSlug: z.string(),
    /** Trigram similarity, 0..1. Ordering only — never shown to a shopper. */
    rank: z.number(),

    /**
     * The cheapest variant that SURVIVED THE FILTERS, and its "was" price.
     *
     * Filter-dependent on purpose: narrowing to black on a shirt whose beige
     * is cheaper must re-price the card to the black one, or it advertises a
     * price the shopper has just excluded themselves from.
     *
     * Null when the product has no live variant at all — a real state, not a
     * defect, and why `basePrice` is still here as the display fallback.
     */
    priceFrom: moneySchema.nullable().optional().default(null),
    compareAtPrice: moneySchema.nullable().optional().default(null),

    /**
     * Whether any surviving variant is sellable, from AVAILABILITY — on-hand
     * minus live holds — never on-hand alone.
     *
     * OPTIONAL, AND DELIBERATELY NOT DEFAULTED TO false. An API that has not
     * shipped the variant join yet sends no such key, and `false` would print
     * "خلص" across an entire healthy catalogue — the worst possible direction
     * to be wrong in, because a shopper acts on it and does not buy.
     *
     * `undefined` means NOBODY SAID. The card renders the sold-out overlay
     * only when this is explicitly false, so an old API shows no claim at all
     * rather than a false one.
     */
    inStock: z.boolean().optional(),
  })
  .strict();
export type SearchResult = z.infer<typeof searchResultSchema>;

/**
 * What the rail draws itself from.
 *
 * Counts come from the API and never from the loaded page: a count derived in
 * the browser describes the rows already fetched and silently lies about the
 * ones behind "show more". Each facet excludes its OWN filter and applies
 * every other one, so a shopper can always widen a filter they narrowed.
 */
export const searchBrandFacetSchema = z
  .object({ slug: z.string(), name: z.string(), count: z.number().int() })
  .strict();

export const searchFacetValueSchema = z
  .object({ value: z.string(), count: z.number().int() })
  .strict();

export const searchFacetsSchema = z
  .object({
    brands: z.array(searchBrandFacetSchema),
    sizes: z.array(searchFacetValueSchema),
    colors: z.array(searchFacetValueSchema),
    /** Null when nothing matched carries a variant price to bound a slider. */
    price: z.object({ min: moneySchema, max: moneySchema }).strict().nullable(),
  })
  .strict();
export type SearchFacets = z.infer<typeof searchFacetsSchema>;

/** An API that has not shipped facets yet sends none. */
const EMPTY_FACETS: SearchFacets = {
  brands: [],
  sizes: [],
  colors: [],
  price: null,
};

export const searchResultPageSchema = z
  .object({
    items: z.array(searchResultSchema),
    page: z.number().int().min(1),
    perPage: z.number().int().min(1),
    hasMore: z.boolean(),
    /**
     * OPTIONAL, AND THAT IS THE WHOLE POINT.
     *
     * Required, this field breaks every search against an API that has not
     * deployed the facet query yet: the schema is `.strict()`, the key is
     * absent, parsing fails, and the screen shows "we cannot search right now"
     * against a perfectly healthy backend. That is the identical failure
     * `publicBrandSchema` had — a contract describing something other than the
     * wire is not stricter, it is wrong — and a frontend that ships before its
     * backend must degrade to no rail rather than to no search.
     *
     * Defaulted rather than left undefined so no call site has to guard it.
     */
    facets: searchFacetsSchema.optional().default(EMPTY_FACETS),
  })
  .strict();
export type SearchResultPage = z.infer<typeof searchResultPageSchema>;

