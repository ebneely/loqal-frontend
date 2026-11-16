"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";

import type {
  SearchFacets,
  SearchResult,
  SearchSort,
} from "@loqal/contracts/storefront.contract";
import {
  fetchCategories,
  searchProducts,
  queryKeys,
  type SearchFilters,
} from "@/lib/catalog";
import { ApiError } from "@/lib/api";
import type { Locale } from "@/lib/locale";
import { useLocale } from "@/lib/locale-context";
import { Shell } from "@/components/shell";
import { Money } from "@/components/money";
import { SearchCard } from "@/components/search-card";
import { SearchField } from "@/components/search-field";
import { EmptyState } from "@/components/state";
import { safeSearchTerm, track } from "@/lib/analytics";
import { useFailureVariant } from "@/components/failure-variant";
import { StateRail } from "@/components/state-rail";
import { StateWayOn } from "@/components/state-wayon";

import { cleanCategory, cleanQuery, searchHref } from "./search-params";

/**
 * Search, with the filter rail.
 *
 * TWO WAYS IN, AND A SEARCH NEEDS EITHER ONE. A typed word is the obvious one.
 * The other is `?category=<slug>`, which is what every category tile on `/` and
 * on `/categories` is now a link to: `/v1/search/products` takes `category` as
 * a filter beside the brand and size ones, and `query` is optional as long as
 * one of the two is there. So a tile opens the shelf it draws, with no word
 * typed and nothing pre-filled in the box — and a shopper can then type on top
 * of the category rather than replacing it.
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
 * checkbox.
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
  { value: "relevance", ar: "الأقرب إلى البحث", en: "Best match" },
  { value: "newest", ar: "الأحدث", en: "Newest" },
  { value: "priceAsc", ar: "الأقل سعرًا", en: "Price: low to high" },
  { value: "priceDesc", ar: "الأعلى سعرًا", en: "Price: high to low" },
];

/** Toggling a value in or out of a filter list. */
const toggle = (list: string[] | undefined, value: string): string[] => {
  const current = list ?? [];
  return current.includes(value)
    ? current.filter((entry) => entry !== value)
    : [...current, value];
};

export function SearchView() {
  const locale = useLocale();
  const t = (ar: string, en: string) => (locale === "ar" ? ar : en);

  /**
   * SEEDED FROM THE ADDRESS BAR, NOT FROM PROPS.
   *
   * The page used to hand the query and category down as props from its own
   * render, and after a Back those can be older than the address: Next
   * restores a history entry with the tree it was rendered with, and this
   * entry was rendered as a bare `/search` before the term was written into
   * it. `useSearchParams` reads the restored address itself, so a shopper
   * coming Back out of a product gets the search she left. Read once — the
   * state below owns the search from then on, and writes it back.
   */
  const address = useSearchParams();
  const [initialQuery] = useState(() => cleanQuery(address.get("q") ?? ""));
  const [initialCategory] = useState(() =>
    cleanCategory(address.get("category") ?? ""),
  );

  const [term, setTerm] = useState(initialQuery);
  /**
   * The SUBMITTED term, not the typed one. Firing a similarity query on every
   * keystroke is a Postgres scan per character, and a shopper on Egyptian
   * mobile data pays for each round trip.
   */
  const [submitted, setSubmitted] = useState(initialQuery);
  /**
   * The category from the URL is SEEDED INTO THE FILTERS, not held beside them.
   * It is one more thing narrowing the same result set, so it belongs in the
   * same object — which is also what puts it in the query key, and what makes
   * dropping it a `setFilters` like every other filter rather than a
   * navigation.
   */
  const [filters, setFilters] = useState<SearchFilters>(() => ({
    ...(initialCategory ? { category: initialCategory } : {}),
    // `?offers=1` is the home page's «العروض» row asking for all of them.
    ...(address.get("offers") === "1" ? { onSale: true } : {}),
  }));

  const patch = (next: Partial<SearchFilters>) =>
    setFilters((current) => ({ ...current, ...next }));

  /** The filter block on a phone, folded until asked for. Always open from 820. */
  const [filtersOpen, setFiltersOpen] = useState(false);

  /** Empty string, never undefined, so the query key is stable. */
  const category = filters.category ?? "";
  const offers = filters.onSale === true;
  /** A search needs a word, a shelf, or «عروض فقط». With none there is nothing to ask. */
  const asking = submitted.length > 0 || category.length > 0 || offers;

  /**
   * THE SEARCH, WRITTEN BACK INTO THE ADDRESS.
   *
   * Without this the term lived in state alone, so Back out of a product
   * restored `/search` with nothing in it and the shopper searched again after
   * every piece she opened. REPLACED, not pushed: a new search is not a place
   * Back should step through, and a push per submit would leave a trail of
   * them between her and the page she came from.
   *
   * The native `replaceState` rather than `router.replace`, which would re-run
   * this route's server render for an address bar (see page.tsx); Next folds
   * the native call into its router so `useSearchParams` follows it. Keyed on
   * the SUBMITTED term and the category, so typing does not rewrite the
   * address per keystroke, and compared on clean values so arriving at an
   * address that is already right writes nothing.
   *
   * The rail's own filters are not written. They are ticked against the facet
   * set of one search, and the term and the shelf are what get a shopper back
   * to it.
   */
  useEffect(() => {
    const current = new URLSearchParams(window.location.search);
    if (
      cleanQuery(current.get("q") ?? "") === submitted &&
      cleanCategory(current.get("category") ?? "") === category &&
      (current.get("offers") === "1") === offers
    ) {
      return;
    }
    window.history.replaceState(null, "", searchHref(submitted, category, offers));
  }, [submitted, category, offers]);

  /**
   * The category's NAME, for the line that says what is being filtered.
   *
   * A slug is an address, not a name: a shopper who tapped تيشيرتات must not be
   * shown `tshirts` as the label for their own tap. `/v1/categories` is already
   * fetched and cached by the tiles that got them here, so this is a cache hit
   * in the ordinary case and a cheap list read otherwise — and when it fails or
   * the slug is not in it, the slug itself is printed rather than nothing.
   */
  const categories = useQuery({
    queryKey: queryKeys.categories(),
    queryFn: fetchCategories,
    enabled: category.length > 0,
  });
  const categoryName =
    categories.data
      ?.filter((entry) => entry.slug === category)
      .map(
        (entry) => entry.name[locale] ?? entry.name.ar ?? entry.name.en,
      )[0] ?? category;

  const results = useInfiniteQuery({
    queryKey: queryKeys.search(submitted, 1, filters),
    queryFn: ({ pageParam }) =>
      searchProducts(submitted, pageParam, 20, filters),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.hasMore ? last.page + 1 : undefined),
    enabled: asking,
  });

  /**
   * A 400 IS THE OLD API, NOT A BROKEN SCREEN.
   *
   * `category` is a parameter the search DTO only started accepting recently
   * and the DTO is `.strict()`, so a storefront deployed in front of a backend
   * that has not caught up gets a 400 for every tile tap. That is a specific,
   * recoverable thing — the same search without the category still works — and
   * it gets its own sentence and its own action rather than the generic "we
   * cannot search right now", which would send a shopper away from a page that
   * is one tap from working.
   */
  const staleApi =
    results.isError &&
    category.length > 0 &&
    results.error instanceof ApiError &&
    results.error.statusCode === 400;

  /**
   * THREE DEAD ENDS, ONE PER VISIT.
   *
   * Drawn once on mount, so a shopper does not watch the screen change shape
   * while she reads it. Only this failure has three: a search refused for the
   * category alone is recoverable, and a request that never came back is not
   * the same fact and does not get the same answers.
   */
  const variant = useFailureVariant();

  /**
   * THE SHELF'S OWN NAME, RUN AS THE QUERY THE API DOES ANSWER.
   *
   * `recover` is not a picture of the failure, it is a way around it: the
   * category was refused, `query` never was, so the same word goes back as
   * text. It is narrower than a real category filter — a piece filed under
   * Bags whose title never says "bag" does not come back — and the line above
   * the grid says so rather than letting her believe she has seen the shelf.
   *
   * The rail's own filters go with the category: they were ticked against a
   * facet set this response cannot produce.
   */
  const recovery = useInfiniteQuery({
    queryKey: queryKeys.search(categoryName, 1, { sort: filters.sort }),
    queryFn: ({ pageParam }) =>
      searchProducts(categoryName, pageParam, 20, { sort: filters.sort }),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.hasMore ? last.page + 1 : undefined),
    enabled: staleApi && variant === "recover" && categoryName.length > 0,
  });
  const recovered = recovery.data?.pages.flatMap((page) => page.items) ?? [];
  /* Nothing under the name either, so there is nothing to recover and this
     treatment degrades to the one that always has something to hand over. */
  const recoverable =
    variant === "recover" && (recovery.isPending || recovered.length > 0);

  const pages = results.data?.pages ?? [];
  const items = pages.flatMap((page) => page.items);
  /** Facets describe the whole match set, so the first page is authoritative. */
  const facets: SearchFacets | undefined = pages[0]?.facets;

  /**
   * One SEARCH beacon per typed search and filter set, when its first page
   * lands; a zero-result one is also sent as SEARCH_ZERO_RESULT, the list the
   * admin console reads. A shelf browsed with no typed word is not a search.
   */
  const firstPage = pages[0];
  const tracked = useRef("");
  useEffect(() => {
    if (!firstPage || submitted.length === 0) return;
    const key = JSON.stringify([submitted, filters]);
    if (tracked.current === key) return;
    tracked.current = key;
    const searchTerm = safeSearchTerm(submitted);
    if (!searchTerm) return;
    const metadata = { results: firstPage.items.length, hasMore: firstPage.hasMore };
    track({ type: "SEARCH", searchTerm, metadata });
    if (firstPage.items.length === 0) track({ type: "SEARCH_ZERO_RESULT", searchTerm, metadata });
  }, [firstPage, submitted, filters]);

  /** An API that does not know «عروض فقط» refuses the whole search with a 400. */
  const offersRefused =
    results.isError &&
    offers &&
    !staleApi &&
    results.error instanceof ApiError &&
    results.error.statusCode === 400;

  /**
   * Whether there is anything to draw a rail from.
   *
   * An API build without the variant join parses fine — `facets` is defaulted
   * rather than required, so search still works — but every list comes back
   * empty. Headings with nothing under them read as a broken rail, so the
   * absence gets said out loud instead — but only beside results, because a
   * search that matched nothing has empty facets on every build.
   */
  const hasFacets = Boolean(
    facets &&
    (facets.brands.length > 0 ||
      facets.sizes.length > 0 ||
      facets.colors.length > 0 ||
      facets.price),
  );

  /**
   * THE CATEGORY IS NOT COUNTED HERE and "مسح" does not remove it.
   *
   * This number drives the rail's clear-all and the "nothing matches these
   * filters" wording, and the category is not one of the things a shopper
   * ticked in that rail — it is the shelf they walked up to. Wiping it with the
   * rest would empty the page of its subject on a tap meant to widen the
   * results, so it has its own line, its own name and its own way out above the
   * grid.
   */
  const activeCount =
    (filters.brands?.length ?? 0) +
    (filters.sizes?.length ?? 0) +
    (filters.colors?.length ?? 0) +
    (filters.priceMin != null || filters.priceMax != null ? 1 : 0) +
    (filters.inStockOnly ? 1 : 0) +
    (filters.onSale ? 1 : 0);

  /** Everything the rail set, dropped; the shelf kept. */
  const clearFilters = () => setFilters(category ? { category } : {});
  /** The shelf, dropped; a typed word and the rail's own filters kept. */
  const clearCategory = () => patch({ category: undefined });
  /** The shelf's name, typed into the box for her: the search that does work. */
  const searchCategoryName = () => {
    setTerm(categoryName);
    setSubmitted(categoryName);
    setFilters({ sort: filters.sort });
  };

  return (
    <Shell title={t("البحث", "Search")}>
      <div className="lq-wrap lq-srch">
        {/* The page names what it is showing: the shelf when one is chosen,
            otherwise the search itself. */}
        <h1 className="lq-pagetitle lq-srch__title" data-bidi>
          {category
            ? categoryName
            : offers && submitted.length === 0
              ? t("العروض", "Offers")
              : t("البحث", "Search")}
        </h1>

        <SearchField
          className="lq-srch__field"
          value={term}
          onValueChange={setTerm}
          onSearch={setSubmitted}
          placeholder={t("ابحث عن قطعة أو متجر…", "Search for a piece or a shop…")}
          label={t("ابحث", "Search")}
        />

        {/* WHICH SHELF, AND THE WAY OFF IT.
            A filter a shopper cannot see is a filter they will blame the shop
            for. This sits directly under the box, above everything it narrows,
            and the × on it is the whole of "show me everything again". */}
        {category ? (
          <div className="lq-vp__row lq-srch__shelf">
            <span className="lq-hint">{t("القسم", "Category")}</span>
            <button
              type="button"
              className="lq-chip"
              data-removable="true"
              onClick={clearCategory}
            >
              <span data-bidi>{categoryName}</span>
              <span aria-hidden="true">×</span>
              <span className="lq-vh">
                {t("إزالة القسم", "Clear the category")}
              </span>
            </button>
          </div>
        ) : null}

        {!asking ? (
          /* The blank state has to carry the page on its own — before a query
             there are no results, no rail and no facets, and a single sentence
             left the whole screen a thin strip above the footer. It says how
             search behaves, then hands over the two routes that browse without
             one. */
          <section className="lq-srch__blank">
            <p className="lq-prose">
              {t(
                "اكتب اسم قطعة أو متجر. يقارن البحث الكلمات، فلا يلزم أن تكتبها بدقة.",
                "Type the name of a piece or a shop. Search compares words, so it does not have to be exact.",
              )}
            </p>
            <p className="lq-prose">
              {t(
                "بعد البحث تظهر بجانب النتائج فلاتر المتجر والمقاس واللون والسعر.",
                "Once you search, filters for shop, size, colour and price appear beside the results.",
              )}
            </p>
            <div className="lq-rows">
              <Link className="lq-row" href="/categories">
                <span
                  className="lq-icon lq-row__lead"
                  data-icon="shirt"
                  aria-hidden="true"
                />
                <span className="lq-row__body">
                  <span>
                    {t("تصفّح الأقسام", "Browse the categories")}
                  </span>
                  <span className="lq-hint">
                    {t(
                      "كل قطعة على رفّ في متجر",
                      "Every piece is on a shelf in a shop",
                    )}
                  </span>
                </span>
                <span
                  className="lq-icon lq-row__end"
                  data-icon="chevron-right"
                  aria-hidden="true"
                />
              </Link>
              <Link className="lq-row" href="/shops">
                <span
                  className="lq-icon lq-row__lead"
                  data-icon="store"
                  aria-hidden="true"
                />
                <span className="lq-row__body">
                  <span>{t("تصفّح المتاجر", "Browse the shops")}</span>
                  <span className="lq-hint">
                    {t("متاجر لها عناوين حقيقية", "Shops with real addresses")}
                  </span>
                </span>
                <span
                  className="lq-icon lq-row__end"
                  data-icon="chevron-right"
                  aria-hidden="true"
                />
              </Link>
            </div>
          </section>
        ) : staleApi ? (
          /* NO RAIL AND NO COLUMN. A filter rail beside a search that did not
             run is furniture, and it squeezes the one thing on the page that
             has something to say into two thirds of the width, off-centre. */
          <section className="lq-srch__solo">
            {recoverable ? (
              <div className="lq-recover">
                <p className="lq-recover__say" role="status">
                  <span
                    className="lq-icon lq-recover__ic"
                    data-icon="info"
                    aria-hidden="true"
                  />
                  <span>
                    {t(
                      `نعرض كل ما يحمل اسم «${categoryName}». يطابق هذا الخادم الاسم وحده، فالقطعة المسجّلة في القسم دون هذه الكلمة في اسمها لن تظهر.`,
                      `Showing everything called “${categoryName}”. This server matches on the name, so a piece filed under it without the word in its title is not here.`,
                    )}
                  </span>
                  <button
                    type="button"
                    className="lq-btn lq-btn--secondary lq-recover__act"
                    onClick={clearCategory}
                  >
                    {t("إزالة القسم", "Drop the category")}
                  </button>
                </p>

                {recovery.isPending ? (
                  <div className="lq-srch__grid" aria-hidden="true">
                    {Array.from({ length: 8 }, (_, index) => (
                      <span key={index} className="lq-recover__skel">
                        <span className="lq-skel lq-recover__skelart" />
                        <span className="lq-skel lq-recover__skelline" />
                        <span
                          className="lq-skel lq-recover__skelline"
                          data-short="true"
                        />
                      </span>
                    ))}
                  </div>
                ) : (
                  <>
                    <div className="lq-srch__rhead lq-recover__count">
                      <p aria-live="polite">
                        {t(`${recovered.length} قطعة`, `${recovered.length} pieces`)}
                      </p>
                      <SortSelect
                        value={filters.sort ?? "relevance"}
                        locale={locale}
                        onChange={(sort) => patch({ sort })}
                      />
                    </div>
                    <div className="lq-srch__grid">
                      {recovered.map((item, index) => (
                        <SearchCard
                          key={item.id}
                          item={item}
                          locale={locale}
                          delayMs={(index % 4) * 70}
                        />
                      ))}
                    </div>
                    {recovery.hasNextPage ? (
                      <div className="lq-srch__more">
                        <button
                          type="button"
                          className="lq-btn lq-btn--secondary"
                          aria-busy={recovery.isFetchingNextPage}
                          onClick={() => recovery.fetchNextPage()}
                        >
                          {recovery.isFetchingNextPage
                            ? t("جارٍ تحميل المزيد…", "Loading…")
                            : t("عرض المزيد", "Show more")}
                        </button>
                      </div>
                    ) : null}
                  </>
                )}
              </div>
            ) : variant === "rail" ? (
              <EmptyState
                size="page"
                art="shelf"
                artwork={<StateRail />}
                role="alert"
                title={t(
                  "الرف موجود، لكن الطريق إليه لم يُفتح بعد",
                  "The rail is here. This door to it is not open yet",
                )}
                body={t(
                  "يجيب هذا الخادم عن البحث بالاسم لا بالقسم. ابحث بالاسم وستظهر القطع نفسها.",
                  "This server answers a search by name but not by shelf. Search the name and the same pieces come back.",
                )}
                actions={
                  <>
                    <button
                      type="button"
                      className="lq-btn lq-btn--primary"
                      onClick={searchCategoryName}
                    >
                      {t(`ابحث عن «${categoryName}»`, `Search for “${categoryName}”`)}
                    </button>
                    <Link className="lq-btn lq-btn--secondary" href="/shops">
                      {t("تصفّح المتاجر", "Browse the shops")}
                    </Link>
                  </>
                }
              />
            ) : (
              <StateWayOn
                categorySlug={category}
                categoryName={categoryName}
                locale={locale}
                onSearchName={searchCategoryName}
                t={t}
              />
            )}
          </section>
        ) : offersRefused ? (
          <section className="lq-srch__solo">
            <EmptyState
              size="page"
              art="shelf"
              role="status"
              seed="search-offers"
              title={t("تصفية العروض غير متاحة بعد", "Filtering by offers is not available yet")}
              body={t(
                "لا يعرف الخادم هذا الفلتر حتى الآن. أزله وستظهر القطع كلها، وفيها القطع المخفّضة بسعرها المشطوب.",
                "The server does not know this filter yet. Drop it and every piece shows, the reduced ones with their struck price.",
              )}
              actions={
                <button
                  type="button"
                  className="lq-btn lq-btn--primary"
                  onClick={() => patch({ onSale: undefined })}
                >
                  {t("إزالة فلتر العروض", "Drop the offers filter")}
                </button>
              }
            />
          </section>
        ) : results.isError ? (
          <section className="lq-srch__solo">
            <EmptyState
              size="page"
              art="crooked"
              tone="loud"
              role="alert"
              seed="search-error"
              title={t("تعذّر البحث الآن", "We cannot search right now")}
              body={t(
                "لم يصل الرد. لا خطأ فيما كتبته؛ حاول مرة أخرى، وغالبًا ستظهر النتائج.",
                "The request did not come back. Nothing is wrong with what you typed — try again, and it usually answers.",
              )}
              actions={
                <button
                  type="button"
                  className="lq-btn lq-btn--primary"
                  aria-busy={results.isFetching}
                  onClick={() => results.refetch()}
                >
                  {t("حاول مرة أخرى", "Try again")}
                </button>
              }
            />
          </section>
        ) : (
          <div className="lq-srch__results">
            {/* ── The rail ──────────────────────────────────────────────────
                A column from 820 up; on a phone a folded block whose button
                says how many filters are on, so a folded filter is never a
                forgotten one. */}
            <aside
              className="lq-srch__filters"
              data-open={filtersOpen ? "true" : "false"}
              aria-label={t("الفلاتر", "Filters")}
            >
              <button
                type="button"
                className="lq-srch__toggle"
                aria-expanded={filtersOpen}
                aria-controls="lq-srch-filters"
                onClick={() => setFiltersOpen((open) => !open)}
              >
                <span>
                  {t("الفلاتر", "Filters")}
                  {activeCount > 0 ? (
                    <span className="lq-srch__n" data-num>
                      {" "}
                      ({activeCount})
                    </span>
                  ) : null}
                </span>
                <span className="lq-srch__plus" aria-hidden="true" />
              </button>

              <div id="lq-srch-filters" className="lq-srch__fbody">
              <div className="lq-srch__fhead">
                <h2>{t("الفلاتر", "Filters")}</h2>
                {activeCount > 0 ? (
                  <button
                    type="button"
                    className="lq-textlink"
                    onClick={clearFilters}
                  >
                    {t("مسح الكل", "Clear all")}
                  </button>
                ) : null}
              </div>

              {results.isPending ? (
                <p className="lq-hint">
                  {t("جارٍ تحميل الفلاتر…", "Loading filters…")}
                </p>
              ) : !hasFacets ? (
                /* No facets means one of two things, and only one of them is
                   worth a sentence. With results on the page it is a build
                   without the variant join — say so rather than showing
                   headings with nothing under them, which reads as a broken
                   rail. With NO results the facets are empty because nothing
                   matched, and a note about server builds is an internal
                   detail told to a shopper who simply found nothing: the
                   empty state beside it already says that, and the "مسح"
                   above still clears whatever was ticked. */
                items.length > 0 ? (
                  <p className="lq-hint">
                    {t(
                      "لا يرسل هذا الخادم الفلاتر بعد.",
                      "This server build does not send filters yet.",
                    )}
                  </p>
                ) : null
              ) : (
                <>
                  <FacetGroup title={t("المتجر", "Shop")}>
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
                            aria-pressed={
                              filters.sizes?.includes(size.value) ?? false
                            }
                            onClick={() =>
                              patch({
                                sizes: toggle(filters.sizes, size.value),
                              })
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
                          const on =
                            filters.colors?.includes(color.value) ?? false;
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
                                patch({
                                  colors: toggle(filters.colors, color.value),
                                })
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
                                patch({
                                  colors: toggle(filters.colors, color.value),
                                })
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
                      label={t("المتوفر فقط", "In stock only")}
                      checked={filters.inStockOnly ?? false}
                      onChange={() =>
                        patch({ inStockOnly: !filters.inStockOnly })
                      }
                    />
                  </FacetGroup>

                  <FacetGroup title={t("العروض", "Offers")}>
                    <Check
                      label={t("عروض فقط", "Offers only")}
                      checked={offers}
                      onChange={() => patch({ onSale: offers ? undefined : true })}
                    />
                  </FacetGroup>
                </>
              )}
              </div>
            </aside>

            {/* ── Results ─────────────────────────────────────────────────── */}
            <section className="lq-srch__main">
              <div className="lq-srch__rhead">
                {/* No count while the search is failing — "0 نتيجة" beside an
                    error reads as "there is nothing", which is a different and
                    much worse claim than "we could not look". */}
                <p aria-live="polite">
                  {results.isPending
                    ? t("جارٍ البحث…", "Searching…")
                    : results.isError
                      ? ""
                      : submitted.length > 0
                        ? t(
                            `${items.length} نتيجة عن «${submitted}»`,
                            `${items.length} results for “${submitted}”`,
                          )
                        : !category
                          ? t(`${items.length} قطعة في العروض`, `${items.length} pieces on offer`)
                          : t(
                            `${items.length} قطعة في «${categoryName}»`,
                            `${items.length} pieces in “${categoryName}”`,
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
                facets={facets}
                items={items}
                locale={locale}
                onRemove={(next) => setFilters(next)}
              />

              {items.length === 0 && !results.isPending ? (
                /* Three different emptinesses, and they are not the same thing
                   to a shopper: too many filters, a word that matched nothing,
                   or a shelf that has nothing on it yet. Each one names its own
                   way out, because "no results" with no next step is where a
                   session ends. */
                <EmptyState
                  art="shelf"
                  seed={category || submitted || "search-empty"}
                  title={
                    activeCount > 0
                      ? t(
                          "لا توجد نتائج بهذه الفلاتر",
                          "Nothing on the rail with these filters",
                        )
                      : submitted.length > 0
                        ? t(
                            `لا توجد نتائج عن «${submitted}»`,
                            `Nothing here called “${submitted}”`,
                          )
                        : t(
                            `لا توجد قطع في «${categoryName}» بعد`,
                            `Nothing in “${categoryName}” yet`,
                          )
                  }
                  body={
                    activeCount > 0
                      ? t(
                          "أزل فلترًا أو اثنين لتعود القطع إلى الظهور؛ لا توجد الآن قطعة تطابق كل هذه الشروط معًا.",
                          "Drop one or two and the rail fills up again. Nothing in stock matches all of these at once.",
                        )
                      : submitted.length > 0
                        ? t(
                            "جرّب كلمة أقصر، أو اسم المتجر نفسه. يقارن البحث الكلمات ولا يشترط تطابقها حرفيًا.",
                            "Try a shorter word, or the shop's own name. Search compares words rather than matching them.",
                          )
                        : t(
                            "القسم موجود، لكن المتاجر لم تضع فيه شيئًا بعد. جرّب قسمًا آخر أو تصفّح أحد المتاجر.",
                            "The section is here, the shops have just not put anything on it yet. Try another one, or open a shop.",
                          )
                  }
                  actions={
                    activeCount > 0 ? (
                      <button
                        type="button"
                        className="lq-btn lq-btn--primary"
                        onClick={clearFilters}
                      >
                        {t("إزالة الفلاتر", "Clear the filters")}
                      </button>
                    ) : (
                      <>
                        <Link
                          className="lq-btn lq-btn--primary"
                          href="/categories"
                        >
                          {t("كل الأقسام", "All categories")}
                        </Link>
                        <Link
                          className="lq-btn lq-btn--secondary"
                          href="/shops"
                        >
                          {t("تصفّح المتاجر", "Browse the shops")}
                        </Link>
                      </>
                    )
                  }
                />
              ) : results.isPending ? (
                <div className="lq-srch__grid" aria-hidden="true">
                  {Array.from({ length: 12 }, (_, index) => (
                    <span key={index} className="lq-recover__skel">
                      <span className="lq-skel lq-recover__skelart" />
                      <span className="lq-skel lq-recover__skelline" />
                      <span
                        className="lq-skel lq-recover__skelline"
                        data-short="true"
                      />
                    </span>
                  ))}
                </div>
              ) : (
                <div className="lq-srch__grid">
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
                <div className="lq-srch__more">
                  <button
                    type="button"
                    className="lq-btn lq-btn--secondary"
                    aria-busy={results.isFetchingNextPage}
                    onClick={() => results.fetchNextPage()}
                  >
                    {results.isFetchingNextPage
                      ? t("جارٍ تحميل المزيد…", "Loading…")
                      : t("عرض المزيد", "Show more")}
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
        <span className="lq-hint">{t("الترتيب", "Sort")}</span>
        <span className="lq-seltrigger__val">{t(current.ar, current.en)}</span>
        <span
          className="lq-icon lq-chev"
          data-icon="chevron-down"
          aria-hidden="true"
        />
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

function FacetGroup({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="lq-srch__group">
      <h3>{title}</h3>
      {children}
    </section>
  );
}

/**
 * A checkbox drawn by `.lq-check__box`, operated by a real one.
 *
 * The native input stays in the DOM for the keyboard, the screen reader and
 * the label's own click, and is hidden with `.lq-vh` rather than removed —
 * `display: none` would take it out of the tab order and out of the
 * accessibility tree with it. It used to be left visible and the box was never
 * told the state, so a shopper saw a 13px system checkbox tick beside a styled
 * box that stayed empty. The box now reads `data-checked`, which is what the
 * stylesheet keys its fill on, and carries the tick; its focus ring is drawn
 * from the input's `:focus-visible` in components.css.
 */
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
      <input
        type="checkbox"
        className="lq-vh"
        checked={checked}
        onChange={onChange}
      />
      <span
        className="lq-check__box"
        data-checked={checked ? "true" : "false"}
        aria-hidden="true"
      >
        <span className="lq-icon" data-icon="check" />
      </span>
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
 *
 * A shop chip says the shop's NAME. The filter holds slugs, because that is
 * what the API filters on, and the chip used to print one — `nefertari ×`
 * beside a rail that says "Nefertari". The name comes from the brand facet,
 * which keeps listing a ticked shop because a facet never filters by its own
 * dimension; the rows on the page are the second source, for a shop the other
 * filters have pushed out of the facet. Only when neither has it is the slug
 * shown: an address is a poor label, but a chip that says nothing does not
 * tell a shopper which filter its × removes.
 */
function ActiveChips({
  filters,
  facets,
  items,
  locale,
  onRemove,
}: {
  filters: SearchFilters;
  facets: SearchFacets | undefined;
  items: SearchResult[];
  locale: Locale;
  onRemove: (next: SearchFilters) => void;
}) {
  const chips: { key: string; label: string; next: SearchFilters }[] = [];

  const brandName = (slug: string) =>
    facets?.brands.find((brand) => brand.slug === slug)?.name ??
    items.find((item) => item.brandSlug === slug)?.brandName ??
    slug;

  for (const slug of filters.brands ?? []) {
    chips.push({
      key: `brand:${slug}`,
      label: brandName(slug),
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
      label: locale === "ar" ? "المتوفر فقط" : "In stock",
      next: { ...filters, inStockOnly: undefined },
    });
  }
  if (filters.onSale) {
    chips.push({
      key: "offers",
      label: locale === "ar" ? "عروض فقط" : "Offers only",
      next: { ...filters, onSale: undefined },
    });
  }

  if (chips.length === 0) return null;

  return (
    <div className="lq-vp__row lq-srch__chips">
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
            {locale === "ar" ? "إزالة الفلتر" : "Remove filter"}
          </span>
        </button>
      ))}
    </div>
  );
}

