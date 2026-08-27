import { Shell } from "@/components/shell";

/**
 * The route-level pending state.
 *
 * Without this file a navigation that has to wait on the API paints the OLD
 * page until the new one is ready, and on Egyptian mobile data that reads as a
 * tap that did nothing. This is what Next shows in the meantime.
 *
 * A SKELETON, NEVER A SPINNER: DESIGN.md is explicit, and the reason is that a
 * skeleton also holds the layout it is about to be replaced by, so the page
 * does not jump when the content lands.
 *
 * WRAPPED IN `Shell`, unlike the two error screens. The chrome is rendered by
 * each page rather than by the root layout, so a bare skeleton here would take
 * the header and the tab bar away for the length of every navigation and put
 * them back — the shopper would watch the frame of the app flicker. `Shell`
 * cannot be the thing that failed here, because nothing has failed.
 *
 * The shape is the product grid, which is what most of these routes are. The
 * cells are the same hairline grid the real one uses, so nothing reflows.
 */

/** Eight, which fills two rows on a phone and two on a desktop. */
const CELLS = Array.from({ length: 8 }, (_, index) => index);

export default function Loading() {
  return (
    <Shell>
      <div className="lq-wrap" aria-busy="true">
        <div className="lq-pad lq-sec">
          <span className="lq-skel" style={{ blockSize: 26, inlineSize: "12rem" }} />
          <span className="lq-skel" style={{ blockSize: 14, inlineSize: "22rem", maxInlineSize: "100%" }} />
        </div>

        <div className="lq-pgrid">
          {CELLS.map((cell) => (
            <div key={cell} style={{ display: "grid", gap: "var(--space-2)" }}>
              <span className="lq-skel" style={{ aspectRatio: "var(--ratio-garment)" }} />
              <span className="lq-skel" style={{ blockSize: 14, inlineSize: "70%" }} />
              <span className="lq-skel" style={{ blockSize: 14, inlineSize: "40%" }} />
            </div>
          ))}
        </div>
      </div>
    </Shell>
  );
}
