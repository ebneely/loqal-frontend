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
                <span className="lq-skel" style={{ display: "block", blockSize: 132, borderRadius: 0 }} />
                <div style={{ display: "grid", gap: "var(--space-2)", padding: "var(--space-4)" }}>
                  <span className="lq-skel" style={{ blockSize: 16, inlineSize: "60%" }} />
                  <span className="lq-skel" style={{ blockSize: 14, inlineSize: "85%" }} />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </Shell>
  );
}
