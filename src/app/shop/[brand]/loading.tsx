import { Shell } from "@/components/shell";

/* Twelve, because the grid runs 2, 3 or 4 across and 12 leaves no track
   bare — an empty track in a shared-hairline grid paints as a grey panel. */
const CELLS = Array.from({ length: 12 }, (_, index) => index);

export default function Loading() {
  return (
    <Shell>
      <div className="lq-wrap" aria-busy="true">
        <div className="lq-pad lq-sec">
          <span className="lq-skel" style={{ blockSize: 13, inlineSize: "11rem", maxInlineSize: "100%" }} />
          <span className="lq-skel" style={{ blockSize: 34, inlineSize: "13rem", maxInlineSize: "100%" }} />
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
