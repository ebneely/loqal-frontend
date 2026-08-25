"use client";

/**
 * The two chevrons beside a rail's title.
 *
 * They scroll the rail by 70% of its own visible width, which is the one
 * measure that behaves at every breakpoint: a fixed pixel step overshoots on a
 * phone and barely moves a 1440px rail, and a whole-width step hides the cell
 * the reader was reading. The 30% overlap keeps a card on screen to anchor to.
 *
 * RTL NEEDS NO SPECIAL CASE. `scrollBy` takes a value on the inline axis and
 * the sign already runs the right way under `dir="rtl"` — scrollLeft is
 * negative there — so the same `dir` moves the rail toward the reading edge in
 * both directions. A mirrored branch here would cancel that out and send both
 * buttons the same way in Arabic.
 *
 * By id rather than a ref because the rail is rendered by a SERVER component:
 * handing it a ref would make the whole page a client component to animate two
 * buttons. This is the only DOM read on the screen.
 *
 * Not keyboard-reachable content: the rail itself scrolls with the arrow keys
 * once focused and every cell inside it is a link, so these are a pointer
 * convenience and carry real labels for the readers who do land on them.
 */
export function RailArrows({
  railId,
  nextLabel,
  prevLabel,
}: {
  railId: string;
  nextLabel: string;
  prevLabel: string;
}) {
  const scroll = (direction: 1 | -1) => {
    const rail = document.getElementById(railId);
    if (!rail) return;
    rail.scrollBy({ left: rail.clientWidth * 0.7 * direction, behavior: "smooth" });
  };

  return (
    <div className="lq-arrows">
      <button type="button" onClick={() => scroll(-1)} aria-label={nextLabel}>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M15 5l-7 7 7 7" />
        </svg>
      </button>
      <button type="button" onClick={() => scroll(1)} aria-label={prevLabel}>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
}
