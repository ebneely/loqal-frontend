import { Shell } from "@/components/shell";

/** The shop index while it arrives: the title, then shop-card shaped cells. */
const CELLS = Array.from({ length: 6 }, (_, index) => index);

export default function Loading() {
  return (
    <Shell>
      <div aria-busy="true">
        <div className="lq-browsehead">
          <span className="lq-skel" style={{ display: "block", blockSize: 64, inlineSize: "14rem", maxInlineSize: "100%" }} />
          <span className="lq-skel" style={{ display: "block", blockSize: 16, inlineSize: "22rem", maxInlineSize: "100%", marginBlockStart: 12 }} />
        </div>
        <div className="lq-browsebody">
          <div className="lq-shopgrid">
            {CELLS.map((cell) => (
              <div key={cell}>
                <span className="lq-skel" style={{ display: "block", aspectRatio: "4 / 3" }} />
                <div style={{ display: "grid", gap: "var(--space-2)", padding: "var(--space-3) var(--space-3) 0" }}>
                  <span className="lq-skel" style={{ blockSize: 26, inlineSize: "55%" }} />
                  <span className="lq-skel" style={{ blockSize: 14, inlineSize: "75%" }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Shell>
  );
}
