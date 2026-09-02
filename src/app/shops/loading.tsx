import { Shell } from "@/components/shell";

/** The shop index while it arrives: the same hairline cells, shop-card shaped. */
const CELLS = Array.from({ length: 6 }, (_, index) => index);

export default function Loading() {
  return (
    <Shell>
      <div className="lq-wrap lq-pad" aria-busy="true">
        <section className="lq-sec">
          <span className="lq-skel" style={{ blockSize: 26, inlineSize: "9rem", maxInlineSize: "100%" }} />
          <span className="lq-skel" style={{ blockSize: 14, inlineSize: "18rem", maxInlineSize: "100%" }} />
          <div className="lq-cells">
            {CELLS.map((cell) => (
              <div key={cell}>
                <span className="lq-skel" style={{ display: "block", aspectRatio: "16 / 10", borderRadius: 0 }} />
                <div style={{ display: "grid", gap: "var(--space-2)", padding: "var(--space-3) var(--space-4) var(--space-2)" }}>
                  <span className="lq-skel" style={{ blockSize: 16, inlineSize: "60%" }} />
                  <span className="lq-skel" style={{ blockSize: 14, inlineSize: "85%" }} />
                  <span className="lq-skel" style={{ blockSize: 26, inlineSize: "70%" }} />
                </div>
                <div style={{ display: "flex", gap: 2, padding: "0 var(--space-4) var(--space-3)" }}>
                  {[0, 1, 2, 3, 4].map((slot) => (
                    <span key={slot} className="lq-skel" style={{ flex: 1, aspectRatio: 1 }} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </Shell>
  );
}
