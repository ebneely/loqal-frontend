"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";

import { searchProducts } from "@/lib/catalog";
import { useLocale } from "@/lib/locale-context";
import { Money } from "@/components/money";
import { Shell } from "@/components/shell";

/**
 * Search.
 *
 * TWO COLUMNS, ONE OF WHICH ADMITS IT IS EMPTY. `design/search.html` puts a
 * filter rail beside the results: shops with counts, size pills, colour
 * swatches, a price range, active chips and a sort select. Every one of those
 * is a control this API cannot serve — `searchProductsQuerySchema` is
 * `.strict()` and accepts `query`, `page` and `perPage`, full stop. There is no
 * facet endpoint, no shop parameter, no size or colour or price bound and no
 * sort key.
 *
 * So the rail is built and the controls are not. A checkbox that does nothing
 * is worse than no checkbox: the shopper ticks it, the list does not move, and
 * she stops trusting the screen. PRODUCT.md's line is "say what is absent and
 * why" — the rail says it, in the same voice as the rest of the surface, and it
 * points at the one thing that genuinely narrows a search today (the shop's
 * name, typed into the box, because the trigram query spans Product joined to
 * Brand).
 *
 * THE RESULTS ARE A LIST, NOT CARDS, and that is the API's shape rather than a
 * shortcut. `/v1/search/products` is a raw trigram similarity query selecting
 * id, slug, name, basePrice and the brand — no `coverUrl` and no `inStock`. A
 * `ProductCard` needs both: it would render an empty 3:4 well and a stock badge
 * that is a guess on every single row. See the long note on `searchResultSchema`
 * in `storefront.contract.ts`; this is deliberate and is not a gap to close.
 *
 * PAGING IS "MORE", NEVER A PAGE NUMBER. The response carries `hasMore` and no
 * `total`, because an exact count over a similarity scan is not a meaningful
 * figure and costs a second query. `useInfiniteQuery` appends the next batch to
 * the list already on screen, which is the only paging shape `hasMore` can
 * honestly drive.
 */

/**
 * Openers for a blank screen. These are not filters and not a taxonomy — they
 * are words that go in the box, and tapping one runs exactly the query typing
 * it would. Empty states teach the interface; this one shows what the box eats.
 */
const OPENERS = {
  ar: ["قميص", "تيشيرت", "هودي", "جينز", "جاكيت"],
  en: ["shirt", "tee", "hoodie", "jeans", "jacket"],
} as const;

export function SearchView({ initialQuery = "" }: { initialQuery?: string }) {
  const locale = useLocale();
  const inputRef = useRef<HTMLInputElement>(null);

  const [term, setTerm] = useState(initialQuery);

  /**
   * The submitted term, not the typed one. Firing a similarity query on every
   * keystroke is a Postgres scan per character, and a shopper on Egyptian
   * mobile data pays for each round trip. Enter submits, the button submits,
   * and nothing else does.
   */
  const [submitted, setSubmitted] = useState(initialQuery);

  const results = useInfiniteQuery({
    /* Deliberately NOT `queryKeys.search(q, page)` — that key names one page,
       and this query owns every page of one term at once. */
    queryKey: ["search", submitted],
    queryFn: ({ pageParam }) => searchProducts(submitted, pageParam),
    initialPageParam: 1,
    /* `hasMore`, never `total`. The API fetches one extra row rather than
       counting, so the only question it can answer is "is there another page". */
    getNextPageParam: (last) => (last.hasMore ? last.page + 1 : undefined),
    enabled: submitted.length > 0,
  });

  const rows = results.data?.pages.flatMap((page) => page.items) ?? [];

  const run = (value: string) => {
    const next = value.trim().slice(0, 200);
    setTerm(next);
    setSubmitted(next);
  };

  const clear = () => {
    setTerm("");
    setSubmitted("");
    inputRef.current?.focus();
  };

  const ar = locale === "ar";
  const t = {
    title: ar ? "البحث" : "Search",
    placeholder: ar ? "دوّر على قطعة أو محل" : "Search for an item or a shop",
    submit: ar ? "دوّر" : "Search",
    clear: ar ? "امسح" : "Clear",
    openers: ar ? "جرّب" : "Try",
    prompt: ar
      ? "اكتب اسم قطعة أو اسم محل. اللي هيظهر هنا قطع موجودة عند محلات بتوصّل للقاهرة والجيزة، والاسم اللي فوق كل قطعة هو المحل اللي عنده."
      : "Type the name of a piece or a shop. What appears here are pieces at shops delivering across Cairo and Giza, and the name above each one is the shop that has it.",
    none: ar
      ? "مفيش قطعة اسمها قريب من كده. جرّب كلمة أقصر، أو اكتب اسم المحل."
      : "Nothing is named close to that. Try a shorter word, or type the shop's name.",
    failed: ar
      ? "مش قادرين ندوّر دلوقتي. البحث بيروح للسيرفر كل مرة، فجرّب تاني بعد شوية."
      : "We cannot search right now. Every search goes to the server, so try again in a moment.",
    retry: ar ? "جرّب تاني" : "Try again",
    more: ar ? "اعرض المزيد" : "Show more",
    loadingMore: ar ? "بنجيب المزيد" : "Loading more",
    end: ar ? "دي كل النتايج للكلمة دي." : "That is every result for that word.",
    railTitle: ar ? "فلتر" : "Filters",
    railNote: ar
      ? "لسه مفيش فلاتر هنا. البحث بيقارن الكلام بس — مش بيشوف مقاس ولا لون ولا سعر، وأي خانة نحطها هنا دلوقتي مش هتشيل ولا نتيجة."
      : "There are no filters here yet. Search compares words only — it does not see size, colour or price, and a box put here today would not remove a single result.",
    railSort: ar
      ? "والترتيب بيجي من قرب الكلمة للي كتبته، مش من السعر."
      : "Order comes from how close the word is to what you typed, not from price.",
    railTip: ar
      ? "اللي بيضيّق النتايج فعلاً دلوقتي: اكتب اسم المحل جوه البحث نفسه، أو افتح المحل من"
      : "What actually narrows a search today: put the shop's name in the box, or open the shop from",
    railLink: ar ? "صفحة المحلات" : "the shops page",
  };

  const heading = ar ? `نتايج «${submitted}»` : `Results for “${submitted}”`;

  return (
    <Shell title={t.title}>
      <div className="lq-wrap lq-pad">
        {/* ── The box ──────────────────────────────────────────────────── */}
        <form
          className="lq-sec"
          role="search"
          onSubmit={(event) => {
            event.preventDefault();
            run(term);
          }}
        >
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "var(--space-3)",
              alignItems: "center",
            }}
          >
            <div className="lq-search" style={{ flex: "1 1 260px" }}>
              <span className="lq-icon" data-icon="search" aria-hidden="true" />
              <input
                ref={inputRef}
                type="search"
                value={term}
                onChange={(event) => setTerm(event.target.value)}
                placeholder={t.placeholder}
                aria-label={t.title}
                maxLength={200}
                /* enterKeyHint so an Android keyboard shows "search", not "go" */
                enterKeyHint="search"
              />
              {term.length > 0 ? (
                <button
                  type="button"
                  className="lq-iconbtn lq-search__clear"
                  onClick={clear}
                  aria-label={t.clear}
                >
                  <span className="lq-icon" data-icon="x" aria-hidden="true" />
                </button>
              ) : null}
            </div>

            {/* A real submit, not only the Enter key. The word is beside the
                icon — an icon alone on the one action of a screen is a guess. */}
            <button type="submit" className="lq-btn lq-btn--primary">
              <span className="lq-icon" data-icon="search" aria-hidden="true" />
              {t.submit}
            </button>
          </div>
        </form>

        {/* ── Heading ──────────────────────────────────────────────────── */}
        <div className="lq-sec__head">
          <h1 className="lq-phead__title" data-bidi>
            {submitted.length > 0 ? heading : t.title}
          </h1>

          {/* The COUNT SHOWN, which is a fact, next to whether there is more,
              which is the only other thing the response knows. Never "14
              results" — nothing counted them.

              The element is always in the tree, empty or not: a live region
              mounted at the same moment its text arrives is a region a screen
              reader was not watching, and the count goes unannounced. Empty, it
              generates no line box and costs no height. */}
          <p className="lq-eyebrow" aria-live="polite">
            {submitted.length > 0 && rows.length > 0 ? (
              <>
                <span data-num>{rows.length}</span> {ar ? "نتيجة ظاهرة" : "shown"}
                {results.hasNextPage ? (ar ? " — وفيه كمان" : " — there are more") : null}
              </>
            ) : null}
          </p>
        </div>

        {/* ── Rail + results ───────────────────────────────────────────────
            `.lq-body` is flex-wrap rather than a media query, because nothing
            in this register may read the viewport: the two columns hold while
            the column stems fit side by side and stack the moment they do not,
            so a 430px phone frame embedded in a desktop page stacks like a
            phone. It sits INSIDE `.lq-sec` rather than beside it on the same
            element, because `.lq-sec` is a flex COLUMN and would turn the two
            stems into a stack at every width. */}
        <div className="lq-sec">
          <div className="lq-body">
            <aside
              className="lq-card lq-card--flat lq-card--pad lq-body__rail"
              aria-labelledby="lq-search-filters"
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--space-2)",
                  marginBlockEnd: "var(--space-3)",
                }}
              >
                <span
                  className="lq-icon"
                  data-icon="sliders-horizontal"
                  aria-hidden="true"
                />
                <h2 id="lq-search-filters" className="lq-label">
                  {t.railTitle}
                </h2>
              </div>

              <hr className="lq-rule" />

              {/* No checkboxes, no size pills, no swatches, no range and no sort
                  — see the note at the top of this file. The register would
                  rather explain an absence than draw a control that lies. */}
              <p
                className="lq-hint"
                style={{ marginBlockStart: "var(--space-3)" }}
              >
                {t.railNote}
              </p>
              <p className="lq-hint" style={{ marginBlockStart: "var(--space-2)" }}>
                {t.railSort}
              </p>
              <p className="lq-hint" style={{ marginBlockStart: "var(--space-3)" }}>
                {t.railTip}{" "}
                <Link href="/shops" style={{ color: "var(--green)" }}>
                  {t.railLink}
                </Link>
                .
              </p>
            </aside>

            <section
              className="lq-body__main"
              aria-label={ar ? "النتايج" : "Results"}
            >
              {submitted.length === 0 ? (
                <>
                  <p className="lq-hint">{t.prompt}</p>
                  <p
                    className="lq-eyebrow"
                    style={{ marginBlock: "var(--space-4) var(--space-2)" }}
                  >
                    {t.openers}
                  </p>
                  <div className="lq-cats">
                    {OPENERS[locale].map((word) => (
                      <button
                        key={word}
                        type="button"
                        className="lq-cat"
                        onClick={() => run(word)}
                      >
                        {word}
                      </button>
                    ))}
                  </div>
                </>
              ) : results.isPending ? (
                /* A skeleton in the shape of the row it becomes — shop line,
                   name line, figure — never a spinner in the middle of content. */
                <div className="lq-rows">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "var(--space-4)",
                        padding: "var(--space-4)",
                      }}
                    >
                      <span style={{ display: "grid", gap: 6, flex: "1 1 auto" }}>
                        <span
                          className="lq-skel"
                          style={{ blockSize: 10, inlineSize: "28%" }}
                        />
                        <span
                          className="lq-skel"
                          style={{ blockSize: 14, inlineSize: "62%" }}
                        />
                      </span>
                      <span
                        className="lq-skel"
                        style={{ blockSize: 14, inlineSize: 64, flex: "none" }}
                      />
                    </div>
                  ))}
                </div>
              ) : results.isError ? (
                <div style={{ display: "grid", gap: "var(--space-3)", justifyItems: "start" }}>
                  <p className="lq-hint lq-hint--error" role="alert">
                    {t.failed}
                  </p>
                  <button
                    type="button"
                    className="lq-btn lq-btn--secondary lq-btn--sm"
                    onClick={() => void results.refetch()}
                  >
                    <span
                      className="lq-icon"
                      data-icon="refresh-cw"
                      aria-hidden="true"
                    />
                    {t.retry}
                  </button>
                </div>
              ) : rows.length === 0 ? (
                <p className="lq-hint">{t.none}</p>
              ) : (
                <>
                  {/* The hairline grid, one column. Cells share their borders —
                      a 1px gap over a --line ground — so every interior edge is
                      drawn exactly once. `.lq-rows` rather than `.lq-cells`
                      because that one widens to two and three columns on its
                      own, and a result row is a full-width line of text and a
                      figure. */}
                  <div className="lq-rows">
                    {rows.map((row, index) => (
                      <Link
                        key={row.id}
                        href={`/shop/${row.brandSlug}/${row.slug}`}
                        /*
                          `.lq-card--link` carries the hover and press states and
                          NOT `.lq-card`, whose own 1px border would double-draw
                          every edge this grid already owns.

                          NOT `.lq-line` either. That is the cart-line component
                          and its grid is `72px 1fr auto` — a photo well, details,
                          an end column. A search result has no photograph to put
                          in the well, because the query does not select one.
                        */
                        className="lq-card--link lq-rv"
                        style={
                          {
                            display: "flex",
                            alignItems: "baseline",
                            justifyContent: "space-between",
                            gap: "var(--space-4)",
                            padding: "var(--space-4)",
                            minBlockSize: "var(--tap-min)",
                            "--lq-d": `${(index % 6) * 70}ms`,
                          } as React.CSSProperties
                        }
                      >
                        <span style={{ display: "grid", gap: 2, minInlineSize: 0 }}>
                          {/* The shop over the item: on a mixed result list a
                              shopper is choosing a shop as much as a garment, and
                              the shop is a place she could walk to. */}
                          <span className="lq-pcard__brand" data-bidi>
                            {row.brandName}
                          </span>
                          <span className="lq-pcard__name" data-bidi>
                            {row.name?.[locale] ?? row.name?.ar ?? row.name?.en ?? row.slug}
                          </span>
                        </span>

                        {/* basePrice, because the search query has no priceFrom to
                            give. `Money` prints an em dash when it is null — a
                            zero would be a claim the API never made. */}
                        <Money
                          amount={row.basePrice}
                          locale={locale}
                          className="lq-money"
                        />
                      </Link>
                    ))}
                  </div>

                  {/* ── More, never page 7 of 12 ──────────────────────────── */}
                  <div
                    style={{
                      display: "grid",
                      gap: "var(--space-2)",
                      justifyItems: "center",
                      marginBlockStart: "var(--space-6)",
                    }}
                  >
                    {results.hasNextPage ? (
                      <button
                        type="button"
                        className="lq-btn lq-btn--secondary"
                        onClick={() => void results.fetchNextPage()}
                        disabled={results.isFetchingNextPage}
                        aria-busy={results.isFetchingNextPage}
                      >
                        {results.isFetchingNextPage ? t.loadingMore : t.more}
                      </button>
                    ) : (
                      <p className="lq-hint">{t.end}</p>
                    )}
                  </div>
                </>
              )}
            </section>
          </div>
        </div>
      </div>
    </Shell>
  );
}
