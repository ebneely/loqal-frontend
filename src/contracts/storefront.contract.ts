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
export const searchProductsQuerySchema = z
  .object({
    query: z.string().trim().min(1).max(200),
    page: z.coerce.number().int().min(1).default(1),
    perPage: z.coerce.number().int().min(1).max(50).default(20),
  })
  .strict();
export type SearchProductsQuery = z.infer<typeof searchProductsQuerySchema>;

/**
 * SEARCH ANSWERS A DIFFERENT SHAPE, and this is not a tidiness problem.
 *
 * `/v1/search/products` is a raw trigram similarity query over Product joined
 * to Brand. It selects id, slug, name, basePrice and the brand — and nothing
 * else. There is no `coverUrl`, no `priceFrom`, no `inStock` and no `total`,
 * because none of those are in the query and computing them would mean a
 * second pass over every match.
 *
 * So a search result CANNOT be rendered by `ProductCard`, which needs the
 * cover and the stock flag. Reusing `publicProductPageSchema` here — which is
 * what this app did at first — fails to parse every response, and `.strict()`
 * is what turns that into an error at the boundary rather than an undefined
 * price three components away.
 *
 * `hasMore` rather than `total`: an exact count over a similarity search is not
 * a meaningful number and costs a second query, so the API fetches one extra
 * row instead. A screen can offer "more" and cannot offer "page 7 of 12".
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
  })
  .strict();
export type SearchResult = z.infer<typeof searchResultSchema>;

export const searchResultPageSchema = z
  .object({
    items: z.array(searchResultSchema),
    page: z.number().int().min(1),
    perPage: z.number().int().min(1),
    hasMore: z.boolean(),
  })
  .strict();
export type SearchResultPage = z.infer<typeof searchResultPageSchema>;

