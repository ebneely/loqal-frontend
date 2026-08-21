import { z } from 'zod';
import { moneySchema } from './contracts';
import { DeliveryMethodSchema } from './enums';

/**
 * The bag, as the storefront reads and writes it.
 *
 * THE BAG IS PER SHOP, NOT PER BASKET. A shopper can buy from two shops in one
 * checkout and each shop fulfils, ships and charges separately — so this shape
 * is a list of brands, each with its own lines, subtotal, minimum and fare.
 * There is a `subtotal` across all of them because somebody has to know what
 * they are about to pay, but there is deliberately no single "shipping cost":
 * delivery is per shop and an order from two shops is charged twice.
 *
 * Every figure is re-read live by the API on each call and NONE of it ships on
 * an order — `grandTotalEstimate` is named for exactly that reason. Checkout
 * reprices everything from the primary database, so a stale bag can be wrong
 * without being dangerous.
 */

/**
 * NOT `bilingualSchema`. That one requires at least one language and forbids a
 * null, which is right for content a brand authored. These two are different
 * shapes the cart genuinely returns: a warning carries BOTH languages always,
 * and a line's product name carries both keys with either possibly null,
 * because a draft product may never have been named in one of them.
 */
const warningMessageSchema = z
  .object({ ar: z.string(), en: z.string() })
  .strict();

const productNameSchema = z
  .object({ ar: z.string().nullable(), en: z.string().nullable() })
  .strict();

export const cartWarningSchema = z
  .object({
    code: z.string(),
    /** Already translated by the API, both languages, so a screen never maps a
     *  code to a sentence and never invents wording for one it does not know. */
    message: warningMessageSchema,
  })
  .passthrough();
export type CartWarning = z.infer<typeof cartWarningSchema>;

export const cartLineSchema = z
  .object({
    variantId: z.string().uuid(),
    productId: z.string().uuid(),
    brandId: z.string().uuid(),
    quantity: z.number().int().min(1),
    sku: z.string(),
    /** Free-form, and `unknown` values on purpose — this is a frozen snapshot
     *  of a JSON column nothing constrains. Coerce at the point of display. */
    attributes: z.record(z.string(), z.unknown()),
    productName: productNameSchema,
    unitPrice: moneySchema,
    lineTotal: moneySchema,
    /** Whether stock covers the requested quantity RIGHT NOW. */
    available: z.boolean(),
    availableQuantity: z.number().int().min(0),
    brandActive: z.boolean(),
    /**
     * False for a suspended brand or a delisted product — excluded from every
     * subtotal so the shortage is REPORTED rather than silently priced. A
     * merely out-of-stock line stays true: that is transient, and the shopper
     * still owes the price if they trim the quantity.
     */
    includedInTotals: z.boolean(),
  })
  .strict();
export type CartLine = z.infer<typeof cartLineSchema>;

export const cartBrandSchema = z
  .object({
    brandId: z.string().uuid(),
    brandSlug: z.string(),
    brandName: z.string(),
    brandActive: z.boolean(),
    items: z.array(cartLineSchema),
    subtotal: moneySchema,
    minimumOrderValue: moneySchema.nullable(),
    minimumOrderMet: z.boolean(),
    /** How far short, so the screen can say the number instead of "too low". */
    amountToMinimum: moneySchema.nullable(),
    supportedDelivery: z.array(DeliveryMethodSchema),
    /** This shop's fare under the chosen method. Null until one is chosen. */
    impliedFare: moneySchema.nullable(),
  })
  .strict();
export type CartBrand = z.infer<typeof cartBrandSchema>;

export const cartSummarySchema = z
  .object({
    cartId: z.string(),
    brands: z.array(cartBrandSchema),
    deliveryMethod: DeliveryMethodSchema.nullable(),
    /** The INTERSECTION across every shop present — a method only one of them
     *  offers is not offered at all, because the basket ships as one decision. */
    availableDeliveryMethods: z.array(DeliveryMethodSchema),
    subtotal: moneySchema,
    estimatedDeliveryTotal: moneySchema.nullable(),
    /** Informational only. Checkout re-reads everything; this never ships. */
    grandTotalEstimate: moneySchema.nullable(),
    itemCount: z.number().int().min(0),
    discountCodes: z.record(z.string(), z.string()),
    warnings: z.array(cartWarningSchema),
    expiresAt: z.string().datetime(),
  })
  .strict();
export type CartSummary = z.infer<typeof cartSummarySchema>;

export const addCartItemBodySchema = z
  .object({
    variantId: z.string().uuid(),
    quantity: z.number().int().min(1).max(99),
  })
  .strict();
export type AddCartItemBody = z.infer<typeof addCartItemBodySchema>;

export const updateCartItemBodySchema = z
  .object({
    quantity: z.number().int().min(1).max(99),
  })
  .strict();
export type UpdateCartItemBody = z.infer<typeof updateCartItemBodySchema>;

export const setDeliveryMethodBodySchema = z
  .object({
    deliveryMethod: DeliveryMethodSchema,
  })
  .strict();
export type SetDeliveryMethodBody = z.infer<typeof setDeliveryMethodBodySchema>;
