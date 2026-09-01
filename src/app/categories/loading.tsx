import { Shell } from "@/components/shell";

/* Twelve, because the tile grid runs 2, 4 or 6 across and 12 leaves no track
   bare — an empty track in a shared-hairline grid paints as a grey panel. */
const TILES = Array.from({ length: 12 }, (_, index) => index);

export default function Loading() {
  return (
    <Shell>
      <div className="lq-wrap lq-pad" aria-busy="true">
        <section className="lq-sec">
          <span className="lq-skel" style={{ blockSize: 26, inlineSize: "9rem", maxInlineSize: "100%" }} />
          <span className="lq-skel" style={{ blockSize: 14, inlineSize: "18rem", maxInlineSize: "100%" }} />
          <div className="lq-tiles">
            {TILES.map((tile) => (
              <div
                key={tile}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 10,
                  padding: "var(--space-5) var(--space-2)",
                }}
              >
                <span className="lq-skel lq-tile__art" />
                <span className="lq-skel" style={{ blockSize: 14, inlineSize: "4.5rem" }} />
              </div>
            ))}
          </div>
        </section>
      </div>
    </Shell>
  );
}
