import { Shell } from "@/components/shell";

/**
 * A plain legal page: a title, the date it was last changed, and numbered
 * sections of short paragraphs. Prose at reading width, nothing else.
 */
export type LegalSection = { title: string; body: string[] };

export function LegalPage({
  title,
  lede,
  updated,
  sections,
}: {
  title: string;
  lede: string;
  updated: string;
  sections: LegalSection[];
}) {
  return (
    <Shell title={title}>
      <article className="lq-wrap lq-legal">
        <header className="lq-legal__head">
          <h1 className="lq-pagetitle">{title}</h1>
          <p className="lq-lede">{lede}</p>
          <p className="lq-hint" data-num>
            {updated}
          </p>
        </header>
        {sections.map((section, index) => (
          <section key={section.title} className="lq-legal__sec" aria-labelledby={`legal-${index}`}>
            <h2 id={`legal-${index}`}>
              <span data-num>{index + 1}. </span>
              {section.title}
            </h2>
            {section.body.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </section>
        ))}
      </article>
    </Shell>
  );
}
