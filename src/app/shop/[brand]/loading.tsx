import { Shell } from "@/components/shell";

/** A shop while it arrives: the green sign, then its product grid. */
const CELLS = Array.from({ length: 8 }, (_, index) => index);

export default function Loading() {
  return (
    <Shell>
      <div aria-busy="true">
        <div className="lq-shophero" />
        <section className="lq-home__sec">
          <div className="lq-feed">
            {CELLS.map((cell) => (
              <div key={cell} style={{ display: "grid", gap: "var(--space-2)" }}>
                <span className="lq-skel" style={{ aspectRatio: "var(--ratio-garment)" }} />
                <span className="lq-skel" style={{ blockSize: 14, inlineSize: "70%" }} />
                <span className="lq-skel" style={{ blockSize: 14, inlineSize: "40%" }} />
              </div>
            ))}
          </div>
        </section>
      </div>
    </Shell>
  );
}
