import Link from "next/link";

import { Garment, GARMENT_KINDS } from "@/components/garment";
import { HeroShuffle } from "@/components/hero-shuffle";
import type { Locale } from "@/lib/locale";

/**
 * The first screen: a wall of garments, the sentence on a panel over it, and a
 * row of shopfronts along the bottom edge.
 *
 * SERVER-RENDERED, including the wall and the street. Only the reshuffling is
 * a client component, and it animates squares the server already painted — the
 * same division `Reveal` makes. A hero whose content arrives with the bundle is
 * a blank first screen every time the bundle is slow, and this is the one
 * screen that cannot afford it.
 */

/** Enough to fill the widest cell grid; the ones past the fold cost one path. */
const CELLS = 60;

/** Deterministic, so the server and the browser draw the same wall. */
const wallKinds = Array.from(
  { length: CELLS },
  (_, i) => GARMENT_KINDS[i % GARMENT_KINDS.length]
);

/**
 * Shutter, glazing, awning — the three fronts a Cairo street is made of.
 *
 * FOURTEEN, which is more than the street needs to look varied and exactly as
 * many as it needs to be seamless: the drift ends at -50%, so ONE copy of this
 * row has to be wider than the widest viewport or the loop shows bare stone at
 * the trailing edge. At these widths one copy is about 2,900px.
 */
const FRONTS = [0, 1, 2, 1, 0, 2, 1, 0, 2, 0, 1, 2, 1, 0] as const;

function Shopfront({ kind, width }: { kind: number; width: number }) {
  const w = width;
  return (
    <svg viewBox={`0 0 ${w} 210`} width={w} height={210} aria-hidden="true" focusable="false">
      <g fill="none" stroke="var(--line)" strokeWidth="1.25" strokeLinejoin="round">
        <path d={`M8 30h${w - 16}v180M8 30v180M8 44h${w - 16}`} />

        {kind === 0 ? (
          <>
            <path d={`M14 52 L${w - 14} 52 L${w - 26} 78 L26 78 Z`} />
            <path
              strokeWidth="1"
              d={Array.from({ length: Math.floor((w - 64) / 16) }, (_, i) => {
                const x = 38 + i * 16;
                return `M${x} 78L${x + 8} 52`;
              }).join("")}
            />
          </>
        ) : null}

        {kind === 1 ? (
          <>
            <path d={`M22 54h${w - 44}v56H22z`} />
            <path
              strokeWidth="1"
              d={Array.from({ length: 6 }, (_, i) => `M22 ${62 + i * 9}H${w - 22}`).join("")}
            />
          </>
        ) : null}

        {kind === 2 ? (
          <path d={`M22 56h${w - 44}v54H22zM${w / 2} 56v54`} />
        ) : null}

        {/* The door, and its handle. The one detail that makes it a shop you
            could walk into rather than a rectangle. */}
        <path d={`M${w - 62} 128h40v82h-40z`} />
        <circle cx={w - 52} cy={170} r="2.5" />
      </g>
    </svg>
  );
}

function Street() {
  // Twice: the drift ends at -50%, which has to land on an identical frame.
  const row = [...FRONTS, ...FRONTS];

  return (
    <div className="lq-street" aria-hidden="true">
      <div className="lq-street__row">
        {row.map((kind, i) => (
          <Shopfront key={i} kind={kind} width={180 + (i % 3) * 34} />
        ))}
      </div>
    </div>
  );
}

export function Hero({ locale }: { locale: Locale }) {
  const ar = locale === "ar";

  return (
    <section className="lq-hero" aria-labelledby="hero-lede">
      <div className="lq-hero__field">
        <div className="lq-wall" aria-hidden="true">
          {wallKinds.map((kind, i) => (
            <div className="lq-cell" key={i}>
              <Garment className="lq-garment lq-cell__art" kind={kind} />
            </div>
          ))}
        </div>

        <div className="lq-hero__panel">
          <h1 className="lq-hero__lede" id="hero-lede">
            {ar
              ? "كل قطعة على رف في محل تقدر تعدّي عليه."
              : "Every piece is on a shelf in a shop you could walk to."}
          </h1>

          <div className="lq-hero__acts">
            <Link className="lq-btn lq-btn--primary lq-btn--lg" href="/search">
              {ar ? "ابدأ التسوق" : "Shop now"}
            </Link>
            <Link className="lq-hero__more" href="/shops">
              {ar ? "اتفرّج على المحلات" : "Browse the shops"}
            </Link>
          </div>
        </div>
      </div>

      <Street />
      <HeroShuffle />
    </section>
  );
}
