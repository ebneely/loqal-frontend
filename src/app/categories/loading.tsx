import { Shell } from "@/components/shell";

/** The category list while it arrives: the title, then big-list rows. */
const ROWS = Array.from({ length: 6 }, (_, index) => index);

export default function Loading() {
  return (
    <Shell>
      <div aria-busy="true">
        <div className="lq-browsehead">
          <span className="lq-skel" style={{ display: "block", blockSize: 64, inlineSize: "14rem", maxInlineSize: "100%" }} />
          <span className="lq-skel" style={{ display: "block", blockSize: 16, inlineSize: "22rem", maxInlineSize: "100%", marginBlockStart: 12 }} />
        </div>
        <div className="lq-browsebody">
          <ul className="lq-biglist">
            {ROWS.map((row) => (
              <li key={row}>
                <span className="lq-biglist__row">
                  <span className="lq-skel" style={{ blockSize: "clamp(40px, 5cqi, 72px)", inlineSize: `${10 + (row % 3) * 3}rem`, maxInlineSize: "70%" }} />
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Shell>
  );
}
