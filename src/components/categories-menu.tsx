"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import type { PublicCategory } from "@loqal/contracts/storefront.contract";
import { fetchCategories, queryKeys } from "@/lib/catalog";
import { useLocale } from "@/lib/locale-context";
import { Garment, categoryGarment } from "@/components/garment";
import { MegaMenu } from "@/components/mega-menu";

/**
 * الأقسام, as a panel rather than a destination — the same shape as the shops
 * menu beside it: an index on one side, a feature pane on the other that
 * follows whichever shelf the pointer or the keyboard is on. Two neighbours in
 * one header behaving alike is the point.
 *
 * Parents head their group with their children beneath; both are links,
 * because filtering by a parent brings its children with it.
 */
export function CategoriesMenu() {
  const locale = useLocale();
  const [featured, setFeatured] = useState<PublicCategory | null>(null);

  const { data, isPending, isError } = useQuery({
    queryKey: queryKeys.categories(),
    queryFn: fetchCategories,
    staleTime: 5 * 60 * 1000,
  });

  const groups = useMemo(() => {
    const all = data ?? [];
    const roots = all.filter((entry) => entry.parentId === null);
    /* A category whose parent is missing from the list stands as its own root
       rather than becoming unreachable. */
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

  const shelf = (slug: string) => `/search?category=${encodeURIComponent(slug)}`;

  /* The pane is never empty while the panel is open. */
  const shown = featured ?? groups[0]?.root ?? null;
  const shownChildren = shown
    ? (groups.find((group) => group.root.id === shown.id)?.children ??
      groups.find((group) =>
        group.children.some((child) => child.id === shown.id),
      )?.children ??
      [])
    : [];

  return (
    <MegaMenu
      id="categories"
      href="/categories"
      label={locale === "ar" ? "الأقسام" : "Categories"}
    >
      <div className="lq-mega__az" data-empty={groups.length === 0}>
        {groups.length === 0 ? (
          isPending ? (
            <div className="lq-mega__wait" aria-hidden="true">
              {[0, 1, 2, 3].map((i) => (
                <span className="lq-skel" key={i} style={{ blockSize: "14px" }} />
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
        ) : null}

        {groups.map(({ root, children }) => (
          <div className="lq-mega__grp" key={root.id}>
            <Link
              className="lq-mega__cat"
              href={shelf(root.slug)}
              data-bidi
              onMouseEnter={() => setFeatured(root)}
              onFocus={() => setFeatured(root)}
            >
              {label(root)}
            </Link>
            {children.map((child) => (
              <Link
                key={child.id}
                href={shelf(child.slug)}
                data-bidi
                onMouseEnter={() => setFeatured(child)}
                onFocus={() => setFeatured(child)}
              >
                {label(child)}
              </Link>
            ))}
          </div>
        ))}

        {groups.length > 0 ? (
          <div className="lq-mega__grp">
            <Link className="lq-mega__all" href="/categories">
              {locale === "ar" ? "كل الأقسام" : "All categories"}
            </Link>
          </div>
        ) : null}
      </div>

      {shown ? (
        <Link className="lq-mega__feat" href={shelf(shown.slug)}>
          <span className="lq-mega__pic">
            <Garment className="lq-garment" kind={categoryGarment(shown.slug)} />
          </span>
          <span className="lq-mega__nm" data-bidi>
            {label(shown)}
          </span>
          {shownChildren.length > 0 ? (
            <span className="lq-mega__hd" data-bidi>
              {shownChildren.map((child) => label(child)).join(" · ")}
            </span>
          ) : null}
          <span className="lq-mega__rw">
            {locale === "ar" ? "افتح الرف" : "Open the shelf"}
          </span>
        </Link>
      ) : null}
    </MegaMenu>
  );
}
