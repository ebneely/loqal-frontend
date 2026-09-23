import type { Locale } from "./locale";

/**
 * What a shopper reads for a variant attribute KEY.
 *
 * `attributes` is a free-form JSON column, so its keys are whatever a shop or
 * the seed wrote — in practice lowercase English words: the seed writes
 * `size`, and search filters on `size` and `color`. The product screen used to
 * print the key itself, so an Arabic page read "size — M" over the picker and
 * "اختار size" on its one button.
 *
 * The known keys get real names in both languages. Anything else is still
 * shown, title-cased, rather than hidden: a key nobody translated is still the
 * shop telling the shopper what the choice is about, and dropping it would
 * leave a row of chips with no heading at all.
 *
 * `choose` is the whole button label rather than a word to splice into one.
 * English needs an article ("Choose a size") that Arabic does not, and a
 * fragment would make every caller get that wrong in the same way.
 */
type AttributeName = { label: string; choose: string };

const KNOWN: Record<string, { ar: string; en: string; enChoose: string }> = {
  size: { ar: "المقاس", en: "Size", enChoose: "Choose a size" },
  color: { ar: "اللون", en: "Colour", enChoose: "Choose a colour" },
  colour: { ar: "اللون", en: "Colour", enChoose: "Choose a colour" },
  fit: { ar: "القصّة", en: "Fit", enChoose: "Choose a fit" },
  material: { ar: "الخامة", en: "Material", enChoose: "Choose a material" },
};

/** "sleeve_length" → "Sleeve Length". Arabic has no case, and passes through. */
const titleCase = (key: string) =>
  key
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");

export function attributeName(key: string, locale: Locale): AttributeName {
  const known = KNOWN[key.trim().toLowerCase()];
  if (known) {
    return locale === "ar"
      ? { label: known.ar, choose: `اختار ${known.ar}` }
      : { label: known.en, choose: known.enChoose };
  }

  const label = titleCase(key) || key;
  return locale === "ar"
    ? { label, choose: `اختار ${label}` }
    : { label, choose: `Choose the ${label.toLowerCase()}` };
}
