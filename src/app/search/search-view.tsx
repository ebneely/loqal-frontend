"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";

import type {
  SearchFacets,
  SearchResult,
  SearchSort,
} from "@loqal/contracts/storefront.contract";
import { searchProducts, queryKeys, type SearchFilters } from "@/lib/catalog";
import type { Locale } from "@/lib/locale";
import { useLocale } from "@/lib/locale-context";
import { Shell } from "@/components/shell";
import { Money, MoneyWas } from "@/components/money";
import { Garment, garmentFor } from "@/components/garment";

/**
 * Search, with the filter rail.
 *
 * EVERY CONTROL HERE IS SERVED BY THE API. The rail used to be a paragraph
 * explaining that filters did not exist, because `/v1/search/products` took
 * only a query and a page. It now takes brands, sizes, colours, a price range,
 * a stock flag and a sort, and answers with facet counts — so the rail is
 * built from what came back rather than from a guess about what exists.
 *
 * COUNTS COME FROM THE SERVER, NEVER FROM THE LOADED PAGE. Counting the rows
 * in hand would describe the first twenty results and lie about everything
 * behind "show more" — and the number beside a shop is exactly the thing a
 * shopper uses to decide whether ticking it is worth the tap.
 *
 * Each facet excludes its own filter and applies the others, which is what
 * makes a filter reversible: with Dryp ticked the shop list still offers
 * Versattire, but the size list has already narrowed to Dryp's sizes.
 *
 * ── Not here, and why ───────────────────────────────────────────────────────
 *
 * "المفتوح بس" and "فيه تجربة" are in the reference board and are not built.
 * `Brand` carries no opening hours anywhere in the schema, and there is no
 * try-on capability flag — `TryOnRender` is a render job, and `ProductMedia`
 * carries only a sort order, so nothing marks a garment photo as one that can
 * be tried on. Both are a migration plus data somebody has to curate, not a
 * checkbox. The wishlist heart is absent for the same reason: no model.
 */

/**
 * Colour swatches from free text.
 *
 * `attributes` has no hex — it is whatever a shop typed — so a swatch has to
 * be resolved from the word. Anything unrecognised still renders, as a named
 * chip rather than a wrong colour: showing beige for a word we did not
 * understand is worse than showing the word.
 *
 * THE NAME IS ALWAYS PRESENT, in the label and the accessible name. Colour is
 * never the only carrier of meaning, and roughly one man in twelve cannot
 * separate two of the entries below by eye.
 */
const SWATCHES: Record<string, string> = {
  black: "#14130F",
  أسود: "#14130F",
  white: "#F7F6F3",
  أبيض: "#F7F6F3",
  beige: "#D8C7A9",
  بيج: "#D8C7A9",
  grey: "#8B8880",
  gray: "#8B8880",
  رمادي: "#8B8880",
  navy: "#1F2A44",
  كحلي: "#1F2A44",
  blue: "#2E5C8A",
  أزرق: "#2E5C8A",
  green: "#4A5D3A",
  زيتي: "#4A5D3A",
  أخضر: "#4A5D3A",
  olive: "#6B6B3A",
  brown: "#6B4A2F",
  بني: "#6B4A2F",
  khaki: "#A89968",
  كاكي: "#A89968",
  red: "#A5122A",
  أحمر: "#A5122A",
  pink: "#D9A6AE",
  وردي: "#D9A6AE",
};

const swatchFor = (value: string): string | null =>
  SWATCHES[value.trim().toLowerCase()] ?? null;

const SORTS: { value: SearchSort; ar: string; en: string }[] = [
  { value: "relevance", ar: "الأقرب للكلمة", en: "Best match" },
  { value: "newest", ar: "الأحدث", en: "Newest" },
  { value: "priceAsc", ar: "الأرخص", en: "Price: low to high" },
  { value: "priceDesc", ar: "الأغلى", en: "Price: high to low" },
];

/** Toggling a value in or out of a filter list. */
const toggle = (list: string[] | undefined, value: string): string[] => {
  const current = list ?? [];
  return current.includes(value)
    ? current.filter((entry) => entry !== value)
    : [...current, value];
};

export function SearchView({ initialQuery = "" }: { initialQuery?: string }) {
  const locale = useLocale();
  const t = (ar: string, en: string) => (locale === "ar" ? ar : en);

  const [term, setTerm] = useState(initialQuery);
  /**
   * The SUBMITTED term, not the typed one. Firing a similarity query on every
   * keystroke is a Postgres scan per character, and a shopper on Egyptian
   * mobile data pays for each round trip.
   */
  const [submitted, setSubmitted] = useState(initialQuery);
  const [filters, setFilters] = useState<SearchFilters>({});

  const patch = (next: Partial<SearchFilters>) =>
    setFilters((current) => ({ ...current, ...next }));

  const results = useInfiniteQuery({
    queryKey: queryKeys.search(submitted, 1, filters),
    queryFn: ({ pageParam }) => searchProducts(submitted, pageParam, 20, filters),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.hasMore ? last.page + 1 : undefined),
    enabled: submitted.length > 0,
  });

  const pages = results.data?.pages ?? [];
  const items = pages.flatMap((page) => page.items);
  /** Facets describe the whole match set, so the first page is authoritative. */
  const facets: SearchFacets | undefined = pages[0]?.facets;

  /**
   * Whether there is anything to draw a rail from.
   *
   * An API build without the variant join parses fine — `facets` is defaulted
   * rather than required, so search still works — but every list comes back
   * empty. Headings with nothing under them read as a broken rail, so the
   * absence gets said out loud instead.
   */
  const hasFacets = Boolean(
    facets &&
      (facets.brands.length > 0 ||
        facets.sizes.length > 0 ||
        facets.colors.length > 0 ||
        facets.price)
  );

  const activeCount =
    (filters.brands?.length ?? 0) +
    (filters.sizes?.length ?? 0) +
    (filters.colors?.length ?? 0) +
    (filters.priceMin != null || filters.priceMax != null ? 1 : 0) +
    (filters.inStockOnly ? 1 : 0);

  return (
    <Shell title={t("البحث", "Search")}>
      <div className="lq-wrap lq-pad">
        <form
          className="lq-sec"
          onSubmit={(event) => {
            event.preventDefault();
            setSubmitted(term.trim());
          }}
        >
          <label className="lq-search">
            <span className="lq-icon" data-icon="search" aria-hidden="true" />
            <input
              type="search"
              enterKeyHint="search"
              value={term}
              onChange={(event) => setTerm(event.target.value)}
              placeholder={t("دوّر على قطعة أو محل…", "Search for a piece or a shop…")}
              aria-label={t("بحث", "Search")}
            />
          </label>
        </form>

        {submitted.length === 0 ? (
          /* The blank state has to carry the page on its own — before a query
             there are no results, no rail and no facets, and a single sentence
             left the whole screen a thin strip above the footer. It says how
             search behaves, then hands over the two routes that browse without
             one. */
          <section className="lq-sec">
            <p className="lq-prose">
              {t(
                "اكتب اسم قطعة أو محل. البحث بيقارن الكلام، فمش لازم تكتبه بالظبط.",
                "Type the name of a piece or a shop. Search compares words, so it does not have to be exact."
              )}
            </p>
            <p className="lq-prose">
              {t(
                "أول ما تدوّر، هتلاقي على الشمال فلاتر بالمحل والمقاس واللون والسعر.",
                "Once you search, filters for shop, size, colour and price appear beside the results."
              )}
            </p>
            <div className="lq-rows">
              <Link className="lq-row" href="/categories">
                <span className="lq-icon lq-row__lead" data-icon="shirt" aria-hidden="true" />
                <span className="lq-row__body">
                  <span>{t("اتفرّج على الأقسام", "Browse the categories")}</span>
                  <span className="lq-hint">
                    {t("كل قطعة على رف في محل", "Every piece is on a shelf in a shop")}
                  </span>
                </span>
                <span className="lq-icon lq-row__end" data-icon="chevron-right" aria-hidden="true" />
              </Link>
              <Link className="lq-row" href="/shops">
                <span className="lq-icon lq-row__lead" data-icon="store" aria-hidden="true" />
                <span className="lq-row__body">
                  <span>{t("اتفرّج على المحلات", "Browse the shops")}</span>
                  <span className="lq-hint">
                    {t("محلات ليها عناوين حقيقية", "Shops with real addresses")}
                  </span>
                </span>
                <span className="lq-icon lq-row__end" data-icon="chevron-right" aria-hidden="true" />
              </Link>
            </div>
          </section>
        ) : (
          <div className="lq-body">
            {/* ── The rail ────────────────────────────────────────────────── */}
            <aside
              className="lq-body__rail lq-body__sticky"
              aria-label={t("فلتر", "Filters")}
            >
              <div className="lq-sum__row">
                <h2 className="lq-sec__title">{t("فلتر", "Filters")}</h2>
                {activeCount > 0 ? (
                  <button
                    type="button"
                    className="lq-sec__more"
                    onClick={() => setFilters({})}
                  >
                    {t("مسح", "Clear")}
                  </button>
                ) : null}
              </div>

              {results.isPending ? (
                <p className="lq-hint">{t("بنجيب الفلاتر…", "Loading filters…")}</p>
              ) : !hasFacets ? (
                /* The API answered but sent no facets — a build without the
                   variant join. Say so rather than showing headings with
                   nothing under them, which reads as a broken rail. */
                <p className="lq-hint">
                  {t(
                    "الفلاتر مش متاحة من السيرفر ده لسه.",
                    "This server build does not send filters yet."
                  )}
                </p>
              ) : (
                <>
                  <FacetGroup title={t("المحل", "Shop")}>
                    {facets.brands.map((brand) => (
                      <Check
                        key={brand.slug}
                        label={brand.name}
                        count={brand.count}
                        checked={filters.brands?.includes(brand.slug) ?? false}
                        onChange={() =>
                          patch({ brands: toggle(filters.brands, brand.slug) })
                        }
                      />
                    ))}
                  </FacetGroup>

                  {facets.sizes.length > 0 ? (
                    <FacetGroup title={t("المقاس", "Size")}>
                      <div className="lq-vp__row">
                        {facets.sizes.map((size) => (
                          <button
                            key={size.value}
                            type="button"
                            className="lq-chip"
                            aria-pressed={filters.sizes?.includes(size.value) ?? false}
                            onClick={() =>
                              patch({ sizes: toggle(filters.sizes, size.value) })
                            }
                          >
                            {size.value}
                          </button>
                        ))}
                      </div>
                    </FacetGroup>
                  ) : null}

                  {facets.colors.length > 0 ? (
                    <FacetGroup title={t("اللون", "Colour")}>
                      <div className="lq-vp__row">
                        {facets.colors.map((color) => {
                          const hex = swatchFor(color.value);
                          const on = filters.colors?.includes(color.value) ?? false;
                          return hex ? (
                            <button
                              key={color.value}
                              type="button"
                              className="lq-swatch"
                              aria-pressed={on}
                              /* The word is the accessible name. A swatch alone
                                 is unusable to anyone who cannot separate two
                                 of these by eye. */
                              aria-label={color.value}
                              title={color.value}
                              onClick={() =>
                                patch({ colors: toggle(filters.colors, color.value) })
                              }
                            >
                              <i style={{ background: hex }} />
                            </button>
                          ) : (
                            /* Unrecognised word: render it, never guess a
                               colour for it. */
                            <button
                              key={color.value}
                              type="button"
                              className="lq-chip"
                              aria-pressed={on}
                              onClick={() =>
                                patch({ colors: toggle(filters.colors, color.value) })
                              }
                            >
                              {color.value}
                            </button>
                          );
                        })}
                      </div>
                    </FacetGroup>
                  ) : null}

                  {facets.price ? (
                    <FacetGroup title={t("السعر", "Price")}>
                      <PriceRange
                        min={Number(facets.price.min)}
                        max={Number(facets.price.max)}
                        valueMin={filters.priceMin}
                        valueMax={filters.priceMax}
                        locale={locale}
                        onChange={(next) => patch(next)}
                      />
                    </FacetGroup>
                  ) : null}

                  <FacetGroup title={t("المتاح", "Availability")}>
                    <Check
                      label={t("المتاح بس", "In stock only")}
                      checked={filters.inStockOnly ?? false}
                      onChange={() => patch({ inStockOnly: !filters.inStockOnly })}
                    />
                  </FacetGroup>
                </>
              )}
            </aside>

            {/* ── Results ─────────────────────────────────────────────────── */}
            <section className="lq-body__main">
              <div className="lq-sum__row">
                {/* No count while the search is failing — "0 نتيجة" beside an
                    error reads as "there is nothing", which is a different and
                    much worse claim than "we could not look". */}
                <p className="lq-hint" aria-live="polite">
                  {results.isPending
                    ? t("بندوّر…", "Searching…")
                    : results.isError
                      ? ""
                      : t(
                          `${items.length} نتيجة لـ «${submitted}»`,
                          `${items.length} results for “${submitted}”`
                        )}
                </p>

                <SortSelect
                  value={filters.sort ?? "relevance"}
                  locale={locale}
                  onChange={(sort) => patch({ sort })}
                />
              </div>

              <ActiveChips
                filters={filters}
                locale={locale}
                onRemove={(next) => setFilters(next)}
              />

              {results.isError ? (
                <p className="lq-hint lq-hint--error" role="alert">
                  {t(
                    "مش قادرين ندوّر دلوقتي. جرّب تاني.",
                    "We cannot search right now. Try again."
                  )}
                </p>
              ) : items.length === 0 && !results.isPending ? (
                <p className="lq-prose">
                  {activeCount > 0
                    ? t(
                        "مفيش نتيجة بالفلاتر دي. شيل فلتر أو اتنين وجرّب تاني.",
                        "Nothing matches these filters. Drop one or two and try again."
                      )
                    : t(
                        "مفيش نتيجة للكلمة دي. جرّب كلمة أقصر أو اسم المحل.",
                        "Nothing matches that word. Try a shorter one, or a shop name."
                      )}
                </p>
              ) : (
                <div className="lq-pgrid">
                  {items.map((item, index) => (
                    <SearchCard
                      key={item.id}
                      item={item}
                      locale={locale}
                      delayMs={(index % 4) * 70}
                    />
                  ))}
                </div>
              )}

              {results.hasNextPage ? (
                <div style={{ paddingBlock: "var(--space-6)" }}>
                  <button
                    type="button"
                    className="lq-btn lq-btn--secondary lq-btn--block"
                    aria-busy={results.isFetchingNextPage}
                    onClick={() => results.fetchNextPage()}
                  >
                    {results.isFetchingNextPage
                      ? t("بنجيب المزيد…", "Loading…")
                      : t("اعرض المزيد", "Show more")}
                  </button>
                </div>
              ) : null}
            </section>
          </div>
        )}
      </div>
    </Shell>
  );
}

/**
 * Sort — a trigger showing the CURRENT value, and a popover listbox.
 *
 * The `.dc` desktop twin puts one control here reading "ترتيب · الأحدث", not a
 * row of every option: four chips laid across the results header compete with
 * the result count for the same line and push the grid down on a phone.
 *
 * There is no native `<select>` in this system — the OS wheel cannot be
 * styled, cannot carry a second line of Arabic, and looks like a different
 * product on every Android skin — so this is the vocabulary's own trigger and
 * panel, which already carry the rotating chevron and the tick.
 */
function SortSelect({
  value,
  locale,
  onChange,
}: {
  value: SearchSort;
  locale: Locale;
  onChange: (sort: SearchSort) => void;
}) {
  const [open, setOpen] = useState(false);
  const current = SORTS.find((option) => option.value === value) ?? SORTS[0];
  const t = (ar: string, en: string) => (locale === "ar" ? ar : en);

  return (
    <div className="lq-selwrap">
      <button
        type="button"
        className="lq-seltrigger"
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => setOpen((previous) => !previous)}
      >
        <span className="lq-hint">{t("ترتيب", "Sort")}</span>
        <span className="lq-seltrigger__val">{t(current.ar, current.en)}</span>
        <span className="lq-icon lq-chev" data-icon="chevron-down" aria-hidden="true" />
      </button>

      {open ? (
        <>
          {/* Click-away. A fixed, transparent layer rather than a document
              listener, so closing cannot race the trigger's own toggle and
              reopen it on the same click. */}
          <span
            style={{ position: "fixed", inset: 0, zIndex: "var(--z-scrim)" }}
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div className="lq-selpanel" role="listbox">
            {SORTS.map((option) => (
              <button
                key={option.value}
                type="button"
                role="option"
                className="lq-selitem"
                aria-selected={option.value === value}
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
              >
                {t(option.ar, option.en)}
                <span
                  className="lq-icon lq-selitem__tick"
                  data-icon="check"
                  aria-hidden="true"
                />
              </button>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}

function FacetGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="lq-sec">
      <hr className="lq-rule" />
      <h3 className="lq-vp__label">{title}</h3>
      {children}
    </section>
  );
}

function Check({
  label,
  count,
  checked,
  onChange,
}: {
  label: string;
  count?: number;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="lq-check">
      <input type="checkbox" checked={checked} onChange={onChange} />
      <span className="lq-check__box" aria-hidden="true" />
      <span className="lq-check__text" data-bidi>
        {label}
        {count != null ? (
          <span className="lq-hint" data-num>
            {" "}
            ({count})
          </span>
        ) : null}
      </span>
    </label>
  );
}

/**
 * Two range inputs over one track.
 *
 * A native `<input type="range">` has one thumb, so a two-ended range is two
 * of them stacked — the lower one owns the left half of the track and the
 * upper the right. Each clamps against the other so the handles cannot cross,
 * which is the bug every hand-rolled dual slider ships with.
 *
 * The figures are printed as well as dragged. A slider alone is unusable with
 * a keyboard-only estimate of where 450 is, and the numbers are the thing a
 * shopper is actually deciding on.
 */
function PriceRange({
  min,
  max,
  valueMin,
  valueMax,
  locale,
  onChange,
}: {
  min: number;
  max: number;
  valueMin?: number;
  valueMax?: number;
  locale: Locale;
  onChange: (next: { priceMin?: number; priceMax?: number }) => void;
}) {
  const low = valueMin ?? min;
  const high = valueMax ?? max;
  /** A single-priced result set has nothing to drag between. */
  const flat = max <= min;

  return (
    <div className="lq-range">
      <div className="lq-sum__row">
        <Money className="lq-money" amount={String(low)} locale={locale} />
        <Money className="lq-money" amount={String(high)} locale={locale} />
      </div>

      {flat ? null : (
        <div className="lq-range__track">
          <input
            type="range"
            min={min}
            max={max}
            value={low}
            aria-label={locale === "ar" ? "أقل سعر" : "Minimum price"}
            onChange={(event) =>
              onChange({ priceMin: Math.min(Number(event.target.value), high) })
            }
          />
          <input
            type="range"
            min={min}
            max={max}
            value={high}
            aria-label={locale === "ar" ? "أعلى سعر" : "Maximum price"}
            onChange={(event) =>
              onChange({ priceMax: Math.max(Number(event.target.value), low) })
            }
          />
        </div>
      )}
    </div>
  );
}

/**
 * The applied filters, each removable.
 *
 * A rail scrolled out of view is a filter a shopper forgot they set, and "no
 * results" with an invisible cause is the worst state this screen has. The
 * chips sit above the grid, where the emptiness would be.
 */
function ActiveChips({
  filters,
  locale,
  onRemove,
}: {
  filters: SearchFilters;
  locale: Locale;
  onRemove: (next: SearchFilters) => void;
}) {
  const chips: { key: string; label: string; next: SearchFilters }[] = [];

  for (const slug of filters.brands ?? []) {
    chips.push({
      key: `brand:${slug}`,
      label: slug,
      next: { ...filters, brands: filters.brands?.filter((b) => b !== slug) },
    });
  }
  for (const size of filters.sizes ?? []) {
    chips.push({
      key: `size:${size}`,
      label: size,
      next: { ...filters, sizes: filters.sizes?.filter((s) => s !== size) },
    });
  }
  for (const color of filters.colors ?? []) {
    chips.push({
      key: `color:${color}`,
      label: color,
      next: { ...filters, colors: filters.colors?.filter((c) => c !== color) },
    });
  }
  if (filters.priceMin != null || filters.priceMax != null) {
    chips.push({
      key: "price",
      label: locale === "ar" ? "السعر" : "Price",
      next: { ...filters, priceMin: undefined, priceMax: undefined },
    });
  }
  if (filters.inStockOnly) {
    chips.push({
      key: "stock",
      label: locale === "ar" ? "المتاح بس" : "In stock",
      next: { ...filters, inStockOnly: undefined },
    });
  }

  if (chips.length === 0) return null;

  return (
    <div className="lq-vp__row" style={{ paddingBlockEnd: "var(--space-3)" }}>
      {chips.map((chip) => (
        <button
          key={chip.key}
          type="button"
          className="lq-chip"
          data-removable="true"
          onClick={() => onRemove(chip.next)}
        >
          <span data-bidi>{chip.label}</span>
          <span aria-hidden="true">×</span>
          <span className="lq-vh">
            {locale === "ar" ? "شيل الفلتر" : "Remove filter"}
          </span>
        </button>
      ))}
    </div>
  );
}

/**
 * A result card.
 *
 * These are cards now rather than a plain list, because the row finally
 * carries what a card needs to be honest: `inStock` for the sold-out state and
 * `priceFrom` for the figure. It still has NO `coverUrl` — that would be a
 * presigned URL per row, a second pass over every match — so the garment
 * drawing stands in, exactly as it does everywhere else there is no photo.
 */
function SearchCard({
  item,
  locale,
  delayMs,
}: {
  item: SearchResult;
  locale: Locale;
  delayMs: number;
}) {
  const name = item.name?.[locale] ?? item.name?.ar ?? item.name?.en ?? "";
  const price = item.priceFrom ?? item.basePrice;

  /**
   * Only from a validated pair. The API refuses a compareAtPrice at or below
   * the price with a 409, so a percentage here cannot be negative — but an
   * unparseable value must not produce "NaN%" on a card either.
   */
  const now = Number(item.priceFrom);
  const was = Number(item.compareAtPrice);
  const off =
    item.priceFrom && item.compareAtPrice && Number.isFinite(now) && Number.isFinite(was) && was > now
      ? Math.round((1 - now / was) * 100)
      : null;

  return (
    <Link
      href={`/shop/${item.brandSlug}/${item.slug}`}
      className="lq-pcard lq-rv"
      style={{ "--lq-d": `${delayMs}ms` } as React.CSSProperties}
    >
      <span className="lq-pcard__well">
        <Garment className="lq-garment" kind={garmentFor(item.id)} />
        {off != null ? (
          <span className="lq-badge lq-badge--sale lq-pcard__tag" data-num>
            −{off}%
          </span>
        ) : null}
        {/* `=== false`, never `!item.inStock`. Undefined means the API did not
            say — an older build with no variant join — and treating "nobody
            said" as "sold out" stamps خلص across a healthy catalogue. */}
        {item.inStock === false ? (
          <span className="lq-pcard__out">{locale === "ar" ? "خلص" : "Sold out"}</span>
        ) : null}
      </span>

      <span className="lq-pcard__brand" data-bidi>
        {item.brandName}
      </span>
      <span className="lq-pcard__name" data-bidi>
        {name}
      </span>

      <span className="lq-sum__row">
        <Money
          className={off != null ? "lq-money lq-money--sale" : "lq-money"}
          amount={price}
          locale={locale}
        />
        {off != null ? <MoneyWas amount={item.compareAtPrice} locale={locale} /> : null}
      </span>
    </Link>
  );
}
