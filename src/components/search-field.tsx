"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { fetchSuggest, queryKeys } from "@/lib/catalog";
import { useLocale } from "@/lib/locale-context";
import {
  clearRecentSearches,
  rememberSearch,
  useRecentSearches,
} from "@/lib/recent-searches";
import { searchHref } from "@/app/search/search-params";

/**
 * The search field, with what it can finish for you.
 *
 * Typing asks `/v1/search/suggest` for shops, categories and pieces — 200ms
 * after the last keystroke, and a newer keystroke aborts the older request
 * (TanStack cancels a query whose key nobody watches any more, through the
 * signal). Focused while empty, it offers the last eight searches from this
 * browser, with «مسح» to forget them.
 *
 * A combobox in the ARIA sense: the arrow keys walk the options, Enter takes
 * the highlighted one (or submits the words when none is), Escape closes. The
 * popup is a real floating panel, so it carries the menu shadow.
 *
 * FAILS SOFT. An API without the suggest route answers 404, and the field is
 * then exactly the plain search field it was. The form still has its GET
 * action, so it searches before the bundle arrives.
 */
type Option = { key: string; label: string; sub?: string; image?: string | null; go: () => void };
type Group = { key: string; title: string; options: Option[] };

export function SearchField({
  className,
  value,
  onValueChange,
  onSearch,
  placeholder,
  label,
}: {
  className?: string;
  /** Controlled when given (the search page); otherwise the field keeps its own. */
  value?: string;
  onValueChange?: (next: string) => void;
  /** Takes the submitted words; without it, the field navigates to /search. */
  onSearch?: (term: string) => void;
  placeholder: string;
  label: string;
}) {
  const locale = useLocale();
  const t = (ar: string, en: string) => (locale === "ar" ? ar : en);
  const router = useRouter();
  const id = useId();
  const listId = `${id}-list`;

  const [own, setOwn] = useState("");
  const term = value ?? own;
  const setTerm = (next: string) => (onValueChange ? onValueChange(next) : setOwn(next));

  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [settled, setSettled] = useState(term);

  useEffect(() => {
    const timer = window.setTimeout(() => setSettled(term), 200);
    return () => window.clearTimeout(timer);
  }, [term]);

  const q = settled.trim().slice(0, 60);
  const typing = term.trim().length > 0;
  const suggest = useQuery({
    queryKey: queryKeys.suggest(q),
    queryFn: ({ signal }) => fetchSuggest(q, signal),
    enabled: open && q.length > 0,
    staleTime: 60_000,
    retry: false,
    // The last answer stays up while the next one is on its way.
    placeholderData: (previous) => previous,
  });
  const recent = useRecentSearches();

  const search = (words: string) => {
    const clean = words.trim();
    setOpen(false);
    setActive(-1);
    if (clean) rememberSearch(clean);
    if (onSearch) onSearch(clean);
    else router.push(searchHref(clean, ""));
  };

  const go = (href: string) => () => {
    if (typing) rememberSearch(term);
    setOpen(false);
    router.push(href);
  };

  const name = (value: { ar?: string; en?: string } | null) =>
    value?.[locale] ?? value?.ar ?? value?.en ?? "";

  const groups: Group[] = [];
  if (!typing) {
    if (recent.length > 0) {
      groups.push({
        key: "recent",
        title: t("عمليات البحث الأخيرة", "Recent searches"),
        options: recent.map((entry) => ({
          key: `r:${entry}`,
          label: entry,
          go: () => {
            setTerm(entry);
            search(entry);
          },
        })),
      });
    }
  } else if (suggest.data && !suggest.isError) {
    const { shops, categories, products } = suggest.data;
    if (shops.length > 0) {
      groups.push({
        key: "shops",
        title: t("المتاجر", "Shops"),
        options: shops.map((shop) => ({
          key: `s:${shop.slug}`,
          label: shop.name,
          go: go(`/shop/${encodeURIComponent(shop.slug)}`),
        })),
      });
    }
    if (categories.length > 0) {
      groups.push({
        key: "categories",
        title: t("الأقسام", "Categories"),
        options: categories.map((category) => ({
          key: `c:${category.slug}`,
          label: name(category.name),
          go: go(searchHref("", category.slug)),
        })),
      });
    }
    if (products.length > 0) {
      groups.push({
        key: "products",
        title: t("القطع", "Pieces"),
        options: products.map((piece) => ({
          key: `p:${piece.brandSlug}/${piece.productSlug}`,
          label: name(piece.name),
          image: piece.imageUrl,
          go: go(`/shop/${encodeURIComponent(piece.brandSlug)}/${encodeURIComponent(piece.productSlug)}`),
        })),
      });
    }
  }

  const options = groups.flatMap((group) => group.options);
  const shown = open && options.length > 0;
  const optionId = (index: number) => `${id}-o${index}`;

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      setOpen(true);
      if (options.length === 0) return;
      const step = event.key === "ArrowDown" ? 1 : -1;
      setActive((at) =>
        at < 0 ? (step > 0 ? 0 : options.length - 1) : (at + step + options.length) % options.length,
      );
    } else if (event.key === "Enter" && shown && active >= 0 && options[active]) {
      event.preventDefault();
      options[active].go();
    } else if (event.key === "Escape" && shown) {
      event.preventDefault();
      setOpen(false);
      setActive(-1);
    }
  };

  /** Where each group's options start in the flat list the keys walk. */
  const starts = groups.map((_, at) =>
    groups.slice(0, at).reduce((sum, group) => sum + group.options.length, 0),
  );

  return (
    <form
      className={`lq-searchbox${className ? ` ${className}` : ""}`}
      action="/search"
      role="search"
      onSubmit={(event) => {
        event.preventDefault();
        search(term);
      }}
    >
      <label className="lq-search">
        <span className="lq-icon" data-icon="search" aria-hidden="true" />
        <input
          type="search"
          name="q"
          enterKeyHint="search"
          autoComplete="off"
          value={term}
          placeholder={placeholder}
          aria-label={label}
          role="combobox"
          aria-expanded={shown}
          aria-controls={shown ? listId : undefined}
          aria-autocomplete="list"
          aria-activedescendant={shown && active >= 0 ? optionId(active) : undefined}
          onChange={(event) => {
            setTerm(event.target.value);
            setOpen(true);
            setActive(-1);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => {
            setOpen(false);
            setActive(-1);
          }}
          onKeyDown={onKeyDown}
        />
      </label>

      {/* Mouse-down is held so a click on an option does not blur the field
          (and close the panel) before the click lands. */}
      {shown ? (
        <div className="lq-suggest" onMouseDown={(event) => event.preventDefault()}>
          {!typing ? (
            <div className="lq-suggest__head">
              <span>{t("عمليات البحث الأخيرة", "Recent searches")}</span>
              <button type="button" className="lq-textlink" onClick={clearRecentSearches}>
                {t("مسح", "Clear")}
              </button>
            </div>
          ) : null}
          <div id={listId} role="listbox" aria-label={label}>
            {groups.map((group, groupAt) => (
              <div key={group.key} role="group" aria-labelledby={`${id}-${group.key}`}>
                <div id={`${id}-${group.key}`} className="lq-suggest__gh" hidden={group.key === "recent"}>
                  {group.title}
                </div>
                {group.options.map((option, optionAt) => {
                  const at = starts[groupAt] + optionAt;
                  return (
                    <div
                      key={option.key}
                      id={optionId(at)}
                      role="option"
                      aria-selected={at === active}
                      className="lq-suggest__opt"
                      onMouseEnter={() => setActive(at)}
                      onClick={option.go}
                    >
                      {group.key === "recent" ? (
                        <span className="lq-icon" data-icon="clock" aria-hidden="true" />
                      ) : group.key === "products" ? (
                        <span className="lq-suggest__th" aria-hidden="true">
                          {option.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={option.image}
                              alt=""
                              loading="lazy"
                              onError={(event) => {
                                event.currentTarget.hidden = true;
                              }}
                            />
                          ) : null}
                        </span>
                      ) : null}
                      <span data-bidi>{option.label}</span>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </form>
  );
}
