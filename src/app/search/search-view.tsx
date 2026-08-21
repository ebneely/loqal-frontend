"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { searchProducts, queryKeys } from "@/lib/catalog";
import { formatPrice } from "@/lib/locale";
import { useLocale } from "@/lib/locale-context";
import { Shell } from "@/components/shell";

/**
 * Search.
 *
 * The results are NOT `ProductCard`s, and that is the API's shape rather than a
 * shortcut: `/v1/search/products` is a trigram similarity query that selects
 * id, slug, name, price and the brand — no cover image and no stock flag. A
 * card built for those two would render an empty well and a wrong badge on
 * every row, so the result is a list of names and prices, which is what the
 * query can actually answer.
 */
export function SearchView() {
  const locale = useLocale();
  const [term, setTerm] = useState("");

  /**
   * The submitted term, not the typed one. Firing a similarity query on every
   * keystroke is a Postgres scan per character, and a shopper on Egyptian
   * mobile data pays for each round trip.
   */
  const [submitted, setSubmitted] = useState("");

  const results = useQuery({
    queryKey: queryKeys.search(submitted, 1),
    queryFn: () => searchProducts(submitted),
    enabled: submitted.length > 0,
  });

  const t = {
    title: locale === "ar" ? "البحث" : "Search",
    placeholder: locale === "ar" ? "دوّر على قطعة أو محل" : "Search for an item or a shop",
    prompt:
      locale === "ar"
        ? "اكتب اسم قطعة أو محل وهنلاقيهولك."
        : "Type the name of an item or a shop and we will find it.",
    none:
      locale === "ar"
        ? "مفيش نتايج للي كتبته. جرّب كلمة تانية."
        : "Nothing matched that. Try another word.",
    failed:
      locale === "ar"
        ? "مش قادرين ندوّر دلوقتي. جرّب تاني بعد شوية."
        : "We cannot search right now. Try again in a moment.",
    more: locale === "ar" ? "فيه نتايج تانية — ضيّق البحث شوية." : "There are more results — narrow your search.",
  };

  return (
    <Shell title={t.title}>
      <div className="lq-wrap lq-pad">
        <form
          className="lq-sec"
          onSubmit={(event) => {
            event.preventDefault();
            setSubmitted(term.trim());
          }}
        >
          <div className="lq-search">
            <span className="lq-icon" data-icon="search" aria-hidden="true" />
            <input
              type="search"
              value={term}
              onChange={(event) => setTerm(event.target.value)}
              placeholder={t.placeholder}
              aria-label={t.title}
              /* enterKeyHint so an Android keyboard shows "search", not "go" */
              enterKeyHint="search"
            />
          </div>
        </form>

        <section className="lq-sec">
          {submitted.length === 0 ? (
            <p className="lq-hint">{t.prompt}</p>
          ) : results.isPending ? (
            <>
              <div className="lq-skel" style={{ blockSize: 56 }} />
              <div className="lq-skel" style={{ blockSize: 56 }} />
              <div className="lq-skel" style={{ blockSize: 56 }} />
            </>
          ) : results.isError ? (
            <p className="lq-hint lq-hint--error" role="alert">
              {t.failed}
            </p>
          ) : results.data.items.length === 0 ? (
            <p className="lq-hint">{t.none}</p>
          ) : (
            <>
              {results.data.items.map((row) => (
                <Link
                  key={row.id}
                  href={`/shop/${row.brandSlug}/${row.slug}`}
                  className="lq-card lq-card--link lq-card--pad"
                  /*
                    NOT `.lq-line`. That is the cart-line component and its grid
                    is `72px 1fr auto` — a photo well, details, an end column.
                    A search result has no photo to put in the well (the query
                    does not select one), so the name would land in a 72px
                    column.
                  */
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    justifyContent: "space-between",
                    gap: "var(--space-3)",
                  }}
                >
                  <span style={{ display: "grid", gap: 2, minInlineSize: 0 }}>
                    {/* The shop over the item: on a mixed result list a shopper
                        is choosing a shop as much as a garment. */}
                    <span className="lq-pcard__brand" data-bidi>
                      {row.brandName}
                    </span>
                    <span className="lq-pcard__name" data-bidi>
                      {row.name?.[locale] ?? row.name?.ar ?? row.name?.en ?? ""}
                    </span>
                  </span>
                  <span className="lq-money">
                    {/* basePrice, because the search query has no priceFrom to
                        give. "—" rather than 0, which would be a claim. */}
                    {row.basePrice ? formatPrice(row.basePrice, locale) : "—"}
                  </span>
                </Link>
              ))}

              {results.data.hasMore ? (
                /* The API answers `hasMore`, never a total — an exact count over
                   a similarity search is not meaningful and costs a second
                   query. So this offers narrowing, not "page 7 of 12". */
                <p className="lq-hint">{t.more}</p>
              ) : null}
            </>
          )}
        </section>
      </div>
    </Shell>
  );
}
