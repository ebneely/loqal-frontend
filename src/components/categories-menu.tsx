"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import type { PublicCategory } from "@loqal/contracts/storefront.contract";
import { fetchCategories, queryKeys } from "@/lib/catalog";
import { useLocale } from "@/lib/locale-context";
import { Garment, categoryGarment } from "@/components/garment";
import { MegaMenu } from "@/components/mega-menu";

/**
 * الأقسام, as the rail of drawings the whole product is built from.
 *
 * A column index left most of the panel empty — six shelves cannot fill a grid
 * meant for an alphabet of shops. The shelves ARE pictures here, laid across
 * one rail: the drawing is what a shopper recognises before they read, and it
 * is the same line art the tiles, the wells and the empty states use.
 */
export function CategoriesMenu() {
  const locale = useLocale();

  const { data, isPending, isError } = useQuery({
    queryKey: queryKeys.categories(),
    queryFn: fetchCategories,
    staleTime: 5 * 60 * 1000,
  });

  /* Parents first, each followed by its own children, so the rail reads in
     the order the taxonomy is written rather than the order it arrived. */
  const ordered = useMemo(() => {
    const all = data ?? [];
    const roots = all.filter((entry) => entry.parentId === null);
    const known = new Set(roots.map((entry) => entry.id));
    const orphans = all.filter(
      (entry) => entry.parentId !== null && !known.has(entry.parentId),
    );
    return [...roots, ...orphans].flatMap((root) => [
      { entry: root, parent: null as PublicCategory | null },
      ...all
        .filter((child) => child.parentId === root.id)
        .map((child) => ({ entry: child, parent: root })),
    ]);
  }, [data]);

  const label = (entry: PublicCategory) =>
    entry.name[locale] ?? entry.name.ar ?? entry.name.en;

  return (
    <MegaMenu
      id="categories"
      href="/categories"
      label={locale === "ar" ? "الأقسام" : "Categories"}
      wide
    >
      {ordered.length === 0 ? (
        isPending ? (
          <div className="lq-catrail" aria-hidden="true">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <span className="lq-catrail__item" key={i}>
                <span className="lq-skel lq-catrail__art" />
                <span className="lq-skel" style={{ blockSize: "12px", inlineSize: "60%" }} />
              </span>
            ))}
          </div>
        ) : (
          <p className="lq-hint" role={isError ? "alert" : undefined}>
            {isError
              ? locale === "ar"
                ? "مش قادرين نوصل للأقسام دلوقتي."
                : "We cannot reach the categories right now."
              : locale === "ar"
                ? "الأقسام هتظهر هنا أول ما تتفتح."
                : "Shelves show up here as they open."}
          </p>
        )
      ) : (
        <>
          <div className="lq-catrail">
            {ordered.map(({ entry, parent }, index) => (
              <Link
                key={entry.id}
                className="lq-catrail__item"
                href={`/search?category=${encodeURIComponent(entry.slug)}`}
                style={{ "--lq-d": `${index * 45}ms` } as React.CSSProperties}
              >
                <span className="lq-catrail__art" aria-hidden="true">
                  <Garment className="lq-garment" kind={categoryGarment(entry.slug)} />
                </span>
                <span className="lq-catrail__name" data-bidi>
                  {label(entry)}
                </span>
                {parent ? (
                  <span className="lq-catrail__in" data-bidi>
                    {label(parent)}
                  </span>
                ) : null}
              </Link>
            ))}
          </div>

          <Link className="lq-mega__all" href="/categories">
            {locale === "ar" ? "كل الأقسام" : "All categories"}
          </Link>
        </>
      )}
    </MegaMenu>
  );
}
