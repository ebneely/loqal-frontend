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
 * الأقسام, as a panel rather than a destination.
 *
 * This used to be a plain link beside المحلات, with the shelves themselves laid
 * out in a rail halfway down the home page. Two problems with that. The rail
 * was the first thing under the hero on the screen a shopper lands on, which
 * spent the top of the page on a taxonomy rather than on shops and pieces; and
 * الأقسام in the header behaved differently from المحلات next to it, which is
 * the inconsistency PRODUCT.md calls out — the same visual vocabulary screen to
 * screen is a virtue.
 *
 * So the shelves moved into the chrome, where they are reachable from every
 * page instead of from one, and the two header entries now behave alike.
 *
 * THE TREE IS THE LAYOUT. `/v1/categories` answers a flat list carrying
 * `parentId`, and a flat panel would throw that away: a top-level shelf and one
 * of its own drawers would sit side by side as equals. Parents are the columns
 * and their children are the list under each — which is what the nesting is
 * for, and it is the same shape as the A–Z index next door.
 */
export function CategoriesMenu() {
  const locale = useLocale();

  /**
   * The same key `/categories` and the search view already use, so opening this
   * is a cache hit on most pages. `staleTime` matches the brands menu: a
   * taxonomy does not move during a session.
   */
  const { data, isPending, isError } = useQuery({
    queryKey: queryKeys.categories(),
    queryFn: fetchCategories,
    staleTime: 5 * 60 * 1000,
  });

  const groups = useMemo(() => {
    const all = data ?? [];
    const roots = all.filter((entry) => entry.parentId === null);
    /**
     * A category whose parent is not in the list stands as its own root rather
     * than vanishing. The list is paged nowhere today, but a child orphaned by
     * a future filter would otherwise be unreachable from this panel — and a
     * shelf that exists and cannot be opened is worse than an untidy column.
     */
    const known = new Set(roots.map((entry) => entry.id));
    const orphans = all.filter(
      (entry) => entry.parentId !== null && !known.has(entry.parentId),
    );
    return [...roots, ...orphans].map((root) => ({
      root,
      children: all.filter((entry) => entry.parentId === root.id),
    }));
  }, [data]);

  const label = (entry: PublicCategory) =>
    entry.name[locale] ?? entry.name.ar ?? entry.name.en;

  /** Every tile and every row opens the shelf, not a landing page for it. */
  const shelf = (slug: string) =>
    `/search?category=${encodeURIComponent(slug)}`;

  return (
    <MegaMenu
      id="categories"
      href="/categories"
      label={locale === "ar" ? "الأقسام" : "Categories"}
      wide
    >
      {groups.length === 0 ? (
        isPending ? (
          /* The tile's own shape, so nothing moves when the shelves land. */
          <div className="lq-cats" aria-hidden="true">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <span className="lq-cat" key={i}>
                <span className="lq-cat__main">
                  <span className="lq-skel lq-cat__art" />
                  <span
                    className="lq-skel"
                    style={{ blockSize: "13px", inlineSize: "62%" }}
                  />
                </span>
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
          <div className="lq-cats">
            {groups.map(({ root, children }) => (
              <div className="lq-cat" key={root.id}>
                {/* The drawing is the tile, not an icon beside a word. This
                    panel is the way into the catalogue on every screen, and a
                    32px glyph in a box reads as a bullet point — the same
                    garment at tile size is what `/categories` shows and what
                    makes a shelf recognisable before it is read. */}
                <Link className="lq-cat__main" href={shelf(root.slug)}>
                  <span className="lq-cat__art" aria-hidden="true">
                    <Garment className="lq-garment" kind={categoryGarment(root.slug)} />
                  </span>
                  <span className="lq-cat__name" data-bidi>
                    {label(root)}
                  </span>
                </Link>
                {/* Only when there are any. Five headings with nothing under
                    them is what a column-per-parent layout gave this taxonomy,
                    which is five roots deep and one child wide. */}
                {children.length > 0 ? (
                  <span className="lq-cat__kids">
                    {children.map((child) => (
                      <Link key={child.id} href={shelf(child.slug)} data-bidi>
                        {label(child)}
                      </Link>
                    ))}
                  </span>
                ) : null}
              </div>
            ))}
          </div>

          <Link className="lq-mega__all" href="/categories">
            {locale === "ar" ? "كل الأقسام" : "All categories"}
            <span className="lq-icon" data-icon="chevron-right" aria-hidden="true" />
          </Link>
        </>
      )}
    </MegaMenu>
  );
}
