import { z } from 'zod';
import { bilingualSchema, moneySchema } from './contracts';
import {
  BrandOrderStatusSchema,
  DeliveryMethodSchema,
  OrderStatusSchema,
  PaymentMethodSchema,
  ProductStatusSchema,
  ReturnStatusSchema,
} from './enums';

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

/**
 * `perPage` caps at 50, matching `listPublicProductsQuerySchema` on the API,
 * and the number is not a preference. This file advertised 60, the API's DTO
 * is `.strict()` and refuses anything above 50, so every caller that trusted
 * the local cap got a 400 — the sitemap asked for 60 per shop and shipped with
 * no product URLs at all. A contract that is looser than the wire buys nothing
 * and hides the failure until runtime.
 */
export const listPublicProductsQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    perPage: z.coerce.number().int().min(1).max(50).default(24),
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
    /**
     * The storefront reads none of these three, and they are here because the
     * API sends them: CATEGORY_FIELDS in the backend's category repository
     * selects them, so `.strict()` rejected every category list and
     * /categories rendered "we cannot reach the categories" against an API
     * that was answering 200.
     */
    sortOrder: z.number().int(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
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


/* ══════════════════════════════════════════════════════════════════════════
   ORDERS, as a SHOPPER reads and writes them.

   Separate from `order.contract.ts` for the same reason the catalogue is:
   that file is the brand console's and the admin's view of the same rows, and
   it describes fields this plane never sees (`orderShopperSchema`, the status
   history, the payment rows) while missing the ones it does — a brand order
   here carries no brand name at all, and an item snapshot carries an
   `imageMediaId` where the console's carries a resolved `imageUrl`. Two
   descriptions of the same table, deliberately not the same fields.

   THREE THINGS THE WIRE DOES NOT CARRY, written down here so no screen
   invents them:

     1. `brandOrders[].brandId` IS THE ONLY IDENTIFIER OF A SHOP. There is no
        name, no slug and no logo on this response. A screen that wants to
        write a shop's name has to resolve the id against the public brand
        index; where it cannot, it says so rather than printing an id as if it
        were a name.
     2. `productSnapshot.imageMediaId` IS NOT A URL, and there is no public
        resolver for it. Nothing can render a product photo from an order, so
        the garment line art stands in, exactly as it does everywhere else.
     3. THERE IS NO `payments[]`. No payment status, no provider reference,
        and no way to re-read a `checkoutUrl` with a GET. A card order whose
        Paymob session was lost is recovered through
        `POST /v1/orders/:orderId/payment-link` and through nothing else.
   ══════════════════════════════════════════════════════════════════════════ */

/**
 * The address the shopper typed, frozen onto the order.
 *
 * NOT `.strict()`, and it is the only read shape in this block that is not.
 * The create body's fields are known exactly — a strict DTO validates them on
 * the way in, and they are repeated below — but what the ORDER echoes back is
 * that snapshot plus whatever else the row carries: `order.contract.ts`
 * describes the same column with a `label` the checkout body has no field
 * for, which is proof the two sets already differ. An unknown extra key here
 * would make a whole order unreadable, and an address is display-only — a
 * shopper who cannot see their order is a worse failure than a key we ignore.
 *
 * Everything but the four parts a rider genuinely needs is optional, because
 * `building` and `notes` are optional on the way in and `fullName` is absent
 * from the console's description of the same snapshot.
 */
export const orderShippingAddressSchema = z.object({
  fullName: z.string().optional(),
  phone: z.string(),
  governorate: z.string(),
  city: z.string(),
  street: z.string(),
  building: z.string().optional(),
  notes: z.string().optional(),
  label: z.string().optional(),
});
export type OrderShippingAddress = z.infer<typeof orderShippingAddressSchema>;

/**
 * The piece as it was at purchase. Editing the product never changes this.
 *
 * `attributes` values are `unknown`, not `string`, for the reason spelled out
 * at length in `order.contract.ts`: this is a frozen copy of a JSON column
 * nothing constrains, and a value-typed schema would make one badly-typed
 * attribute permanently reject an order that no backfill may repair. The
 * screen coerces at the point of display.
 */
export const orderItemSnapshotSchema = z
  .object({
    /** `{}` when the draft was never named in either language. */
    name: z.object({ ar: z.string().optional(), en: z.string().optional() }).strict(),
    sku: z.string(),
    attributes: z.record(z.string(), z.unknown()),
    /**
     * A MEDIA ID, NOT A URL, and there is no public endpoint that turns one
     * into the other. Optional as well as nullable: it is carried so a
     * resolver can arrive later without a contract change, and it renders
     * nothing today.
     */
    imageMediaId: z.string().nullable().optional(),
  })
  .strict();
export type OrderItemSnapshot = z.infer<typeof orderItemSnapshotSchema>;

export const shopperOrderItemSchema = z
  .object({
    id: z.string().uuid(),
    /** Null once the variant is archived. History outlives the catalogue row. */
    variantId: z.string().uuid().nullable(),
    qty: z.number().int().min(1),
    unitPrice: moneySchema,
    lineTotal: moneySchema,
    productSnapshot: orderItemSnapshotSchema,
  })
  .strict();
export type ShopperOrderItem = z.infer<typeof shopperOrderItemSchema>;

/**
 * ONE SHOP'S HALF. This is the unit the whole product is built on.
 *
 * Each of these is packed, booked, delivered and charged by one shop alone, so
 * each carries its OWN status, its own subtotal and its own delivery cost. A
 * screen showing a single rolled-up status for the parent order would have to
 * pick one of them, and picking the optimistic one tells a shopper their order
 * arrived while half of it has not left a shelf.
 *
 * `brandId` AND NOTHING ELSE identifies the shop — see the block note above.
 */
export const shopperBrandOrderSchema = z
  .object({
    id: z.string().uuid(),
    brandId: z.string().uuid(),
    status: BrandOrderStatusSchema,
    /** When the shop accepted its half. Null while it is still checking. */
    acknowledgedAt: z.string().nullable().optional(),
    subtotal: moneySchema,
    shippingCost: moneySchema,
    discountAmount: moneySchema,
    /**
     * What the rider actually collected in cash. Null on every non-cash order
     * and on a cash order nobody has collected from yet, which is why it is
     * nullable AND optional rather than defaulted to "0.00" — a zero here
     * would read as "collected nothing" instead of "not collected".
     */
    codCollectedAmount: moneySchema.nullable().optional(),
    items: z.array(shopperOrderItemSchema),
  })
  .strict();
export type ShopperBrandOrder = z.infer<typeof shopperBrandOrderSchema>;

/**
 * The order. `GET /v1/orders/lookup/:orderNumber?phone=` and
 * `GET /v1/orders/:orderId` both answer this BARE object — no envelope.
 *
 * `status` is the parent's DERIVED roll-up and is deliberately not rendered
 * anywhere in the storefront. It is parsed because it is on the wire and this
 * schema is strict; it is not shown because the screen splits what the backend
 * splits.
 *
 * Dates are plain strings rather than `.datetime()`. That check refuses a UTC
 * offset unless it is asked to allow one, and an order that fails to parse
 * because the API started sending `+02:00` is a shopper who cannot see what
 * they paid for. Nothing here does arithmetic on the value — it is formatted
 * and printed — so the narrow check buys nothing and can only cost.
 */
export const shopperOrderSchema = z
  .object({
    id: z.string().uuid(),
    /** Read out over the phone: LQ-4821-7730. Latin figures, mono face. */
    orderNumber: z.string(),
    status: OrderStatusSchema,
    /** Nullable rather than guessed required — one choice for the whole basket. */
    deliveryMethod: DeliveryMethodSchema.nullable(),
    shippingAddress: orderShippingAddressSchema,
    placedAt: z.string(),
    itemsSubtotal: moneySchema,
    shippingTotal: moneySchema,
    discountTotal: moneySchema,
    grandTotal: moneySchema,
    brandOrders: z.array(shopperBrandOrderSchema),
  })
  .strict();
export type ShopperOrder = z.infer<typeof shopperOrderSchema>;

/**
 * The address half of `POST /v1/orders`. STRICT, and it matches the API's own
 * strict DTO key for key — an extra key here is a 400, not an ignored field.
 */
export const createOrderAddressSchema = z
  .object({
    fullName: z.string().trim().min(1),
    phone: z.string().trim().min(1),
    governorate: z.string().trim().min(1),
    city: z.string().trim().min(1),
    street: z.string().trim().min(1),
    building: z.string().trim().min(1).optional(),
    notes: z.string().trim().min(1).optional(),
  })
  .strict();
export type CreateOrderAddress = z.infer<typeof createOrderAddressSchema>;

/** Who is ordering, when nobody is signed in. The email is not optional. */
export const createOrderGuestSchema = z
  .object({
    firstName: z.string().trim().min(1),
    lastName: z.string().trim().min(1).optional(),
    email: z.email(),
    phone: z.string().trim().min(1),
  })
  .strict();
export type CreateOrderGuest = z.infer<typeof createOrderGuestSchema>;

/**
 * `POST /v1/orders`.
 *
 * WHAT IS NOT IN HERE IS THE POINT. No prices, no cart id, no delivery method
 * and no line items: the server reads the cart off the session and reprices
 * every figure from the primary database, and the delivery method was already
 * written by `PUT /v1/cart/delivery-method`. A client that sent a total would
 * be a client that could be argued with about what something costs.
 *
 * The `Idempotency-Key` header is REQUIRED — the API answers 400 without one —
 * and `X-Guest-Session-Id` is required as well when nobody is signed in. Both
 * are headers rather than body fields and so are not in this schema; see
 * `lib/orders.ts`, which is the only place either is produced.
 */
export const createOrderBodySchema = z
  .object({
    paymentMethod: PaymentMethodSchema,
    shippingAddress: createOrderAddressSchema,
    guest: createOrderGuestSchema.optional(),
  })
  .strict();
export type CreateOrderBody = z.infer<typeof createOrderBodySchema>;

/**
 * What 201 answers.
 *
 * `checkoutUrl` IS NULL IN TWO DIFFERENT MOODS and a screen has to tell them
 * apart:
 *
 *   - CASH, WALLET and INSTAPAY are settled off Paymob, so null is the normal,
 *     finished answer and the shopper goes straight to their order.
 *   - CARD and VALU expect a URL. Null there means the order EXISTS and its
 *     payment session does not — Paymob failed after the row was written. The
 *     shopper must not be told the order failed, because it did not, and must
 *     not be left with no way to pay, which is what
 *     `POST /v1/orders/:orderId/payment-link` is for.
 *
 * `replayed` is true when the `Idempotency-Key` matched a previous call. It is
 * how a retry after a timeout comes back with the ORIGINAL order rather than a
 * second one, and it is the reason the key is minted once per checkout and
 * never once per click.
 */
export const createOrderResultSchema = z
  .object({
    order: shopperOrderSchema,
    replayed: z.boolean(),
    checkoutUrl: z.string().nullable(),
  })
  .strict();
export type CreateOrderResult = z.infer<typeof createOrderResultSchema>;

/**
 * `POST /v1/orders/:orderId/payment-link` — the recovery for a card order that
 * came back with no `checkoutUrl`.
 *
 * NOT `.strict()`, ON PURPOSE. Every other shape in this block was read off an
 * audited response; this is the one route whose body this repo has not seen,
 * and it is the LAST route that may fail on an unexpected key — it only ever
 * runs when a shopper is already stuck with an order they cannot pay for. So
 * an extra field is ignored rather than fatal, and the one field that matters
 * is read under the same name the create response uses for the same thing.
 */
export const orderPaymentLinkSchema = z.object({
  checkoutUrl: z.string().nullable(),
});
export type OrderPaymentLink = z.infer<typeof orderPaymentLinkSchema>;

/* ══════════════════════════════════════════════════════════════════════════
   Cash-order phone verification.

   The guest credential — orderNumber + phone — matches
   `order-verification.contract.ts`'s `guestCredentialSchema` key for key,
   because this page authorises every write the same way it authorises the
   read: there is no signed-in path on this screen at all, only the order
   number and the phone the URL already carries.
   ══════════════════════════════════════════════════════════════════════════ */

const guestCredentialBodySchema = {
  orderNumber: z.string().trim().min(1).max(40),
  phone: z.string().trim().regex(/^01[0-9]{9}$/, 'Expected an Egyptian mobile number'),
};

/** `POST /v1/orders/:orderId/verification` — resend the phone code. */
export const resendOrderVerificationBodySchema = z
  .object(guestCredentialBodySchema)
  .strict();
export type ResendOrderVerificationBody = z.infer<
  typeof resendOrderVerificationBodySchema
>;

/** `POST /v1/orders/:orderId/verification/verify` — check the phone code. */
export const verifyOrderCodeBodySchema = z
  .object({
    ...guestCredentialBodySchema,
    code: z.string().trim().regex(/^[0-9]{6}$/, 'Expected a 6-digit code'),
  })
  .strict();
export type VerifyOrderCodeBody = z.infer<typeof verifyOrderCodeBodySchema>;

/** Both verification routes answer this and nothing else. */
export const orderActionOkSchema = z.object({ ok: z.literal(true) }).strict();
export type OrderActionOk = z.infer<typeof orderActionOkSchema>;

/* ══════════════════════════════════════════════════════════════════════════
   Returns.

   Same credential as above. `brandOrderId` is one of `order.brandOrders[].id`
   already on the page — never typed by the shopper — and the reason is free
   text: there is no taxonomy in `RequestReturnDto` to mirror.
   ══════════════════════════════════════════════════════════════════════════ */

export const requestReturnBodySchema = z
  .object({
    brandOrderId: z.string().uuid(),
    reason: z.string().trim().min(1).max(500),
    orderNumber: z.string().trim().min(1).max(40).optional(),
    phone: z
      .string()
      .trim()
      .regex(/^01[0-9]{9}$/, 'Expected an Egyptian mobile number')
      .optional(),
  })
  .strict();
export type RequestReturnBody = z.infer<typeof requestReturnBodySchema>;

/**
 * `POST /v1/orders/:orderId/returns` — NOT `returnListItemResponseSchema`.
 * That is the brand's dashboard projection; this route answers
 * `ReturnsService.request`'s own return value, which is only these three
 * fields.
 */
export const requestReturnResultSchema = z
  .object({
    id: z.string(),
    brandOrderId: z.string().uuid(),
    status: ReturnStatusSchema,
  })
  .strict();
export type RequestReturnResult = z.infer<typeof requestReturnResultSchema>;
