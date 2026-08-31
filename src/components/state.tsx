import { GARMENT_KINDS, Garment, garmentFor, type GarmentKind } from "./garment";

/**
 * The screens with nothing on them.
 *
 * A storefront has four of these and they are the four moments a shopper is
 * most likely to leave: the API is down, the search found nothing, the address
 * is wrong, the render threw. Every one of them used to be a grey sentence, and
 * a grey sentence on an otherwise empty page reads as the site being broken
 * even when it is only being honest.
 *
 * THE DRAWING IS THE SHOP'S OWN VOCABULARY, not a mascot and not a sad cloud.
 * The whole storefront is a rail, a hanger and a garment in 1px line art —
 * `garment.tsx` draws the twelve garments and `.lq-tile` hangs them in every
 * category cell — so these screens are built out of the same three things:
 *
 *   crooked — a garment still on its hanger, but hanging askew. Something did
 *             not hold. This is the failure state.
 *   slipped — the hanger is up there and empty; the garment is on the floor
 *             underneath it. The piece is not where the address said. 404.
 *   shelf   — a rail of empty hangers. Nothing matched. Not broken, just bare.
 *
 * The motion is one idea repeated: hangers sway, about 4° over six seconds, on
 * the house ease. Nothing bounces, nothing spins, and the fallen garment does
 * not move at all — it has already landed. `states.css` removes all of it under
 * `prefers-reduced-motion`, leaving three drawings that were never dependent on
 * moving to be legible.
 *
 * NO HOOKS AND NO CONTEXT anywhere in this file, deliberately. `not-found.tsx`
 * is a server component and `global-error.tsx` renders when the root layout —
 * providers and all — has already thrown. A rescue screen that needs a provider
 * cannot rescue anything.
 */

export type StateArtKind = "crooked" | "slipped" | "shelf";

/**
 * The hanger, at the size the rail hangs it. viewBox 60×32: the hook curls
 * around y=8, which is where `states.css` puts the rail — so the wire is drawn
 * once and the CSS only has to know that one fraction.
 */
function Hanger() {
  return (
    <svg className="lq-art__wire" viewBox="0 0 60 32" aria-hidden="true" focusable="false">
      <path d="M30 13 V6 a4.5 4.5 0 1 0 -6 3.6" />
      <path d="M30 13 L9 28 L51 28 Z" />
    </svg>
  );
}

/**
 * SIX OF THE TWELVE. A shoe does not go on a hanger and neither does a pair of
 * socks, so the drawing would be telling a small lie about how a shop works —
 * on the screens whose whole job is to be believed.
 *
 * Indexed through `garmentFor` rather than with a second hash, so one function
 * still decides which garment a seed gets and the two cannot drift.
 */
const HANGABLE: readonly GarmentKind[] = [
  "tee",
  "shirt",
  "knit",
  "sweat",
  "jacket",
  "dress",
];

const hangableFor = (seed: string): GarmentKind =>
  HANGABLE[GARMENT_KINDS.indexOf(garmentFor(seed)) % HANGABLE.length];

/**
 * `seed` picks WHICH garment, the same way a product or a category picks one:
 * `garmentFor` hashes it, so the 404 draws the same shirt on every visit and on
 * the server and the client alike. A random one would hydrate differently from
 * the HTML that was sent.
 */
export function StateArt({
  kind,
  seed = "loqaaal",
}: {
  kind: StateArtKind;
  seed?: string;
}) {
  const garment = hangableFor(seed);

  return (
    <div className="lq-art" data-art={kind} aria-hidden="true">
      <span className="lq-art__rail" />

      <div className="lq-art__hangs">
        {kind === "shelf" ? (
          /* Three, because one empty hanger reads as a hanger and three read as
             a rail with nothing left on it. */
          <>
            <span className="lq-art__hang" data-sway="1">
              <Hanger />
            </span>
            <span className="lq-art__hang" data-sway="2">
              <Hanger />
            </span>
            <span className="lq-art__hang" data-sway="3">
              <Hanger />
            </span>
          </>
        ) : (
          <span className="lq-art__hang" data-sway="1">
            <Hanger />
            {/* On `slipped` the hanger is empty and the garment is below, which
                is the whole picture: it came off. */}
            {kind === "crooked" ? (
              <Garment className="lq-garment lq-art__worn" kind={garment} />
            ) : null}
          </span>
        )}
      </div>

      {/* The lower shelf. `slipped` puts the garment on it, and `shelf` leaves
          it bare on purpose — a rail with three empty hangers and nothing else
          is 30px of hairline, which reads as a divider rather than a drawing.
          The empty band under it is what makes the emptiness the subject. */}
      {kind === "crooked" ? null : (
        <span className="lq-art__floor">
          {kind === "slipped" ? (
            <Garment className="lq-garment lq-art__fallen" kind={garment} />
          ) : null}
        </span>
      )}
    </div>
  );
}

/**
 * The state itself: drawing, one sentence of what happened, one of what to do,
 * and the actions.
 *
 * `actions` is a slot rather than a list of hrefs because the action is
 * genuinely different every time — a retry is a button that calls `reset`, a
 * dropped filter is a button that calls `setFilters`, and a way out is a link.
 * A component that only took links would have forced every screen that needs a
 * button to stop using it, which is how the grey sentences happened.
 *
 * PHONE FIRST. The column is centred and capped at a comfortable measure, the
 * drawing scales continuously with the container rather than at a breakpoint,
 * and the actions stack full width below 460px so the primary one is a
 * thumb-sized target rather than half a row.
 */
export function EmptyState({
  art,
  seed,
  artwork,
  title,
  body,
  note,
  actions,
  tone = "quiet",
  size = "inline",
  role,
}: {
  art: StateArtKind;
  seed?: string;
  /**
   * Replaces the drawing outright. For the one treatment whose picture is not
   * an SVG — it carries its own still fallback, so `art` stays required and
   * stays the answer under reduced motion.
   */
  artwork?: React.ReactNode;
  title: React.ReactNode;
  body?: React.ReactNode;
  /** A reference number, a slug, the thing support would ask for. */
  note?: React.ReactNode;
  actions?: React.ReactNode;
  /** `loud` tints the drawing toward the signal colour. Failures only. */
  tone?: "quiet" | "loud";
  /** `page` is a state that IS the screen, with no rail or column beside it. */
  size?: "inline" | "page";
  /** `alert` on a failure, so a screen reader hears it without a reload. */
  role?: "alert" | "status";
}) {
  return (
    <div className="lq-state" data-tone={tone} data-size={size} role={role}>
      {artwork ?? <StateArt kind={art} seed={seed} />}
      <div className="lq-state__say">
        <p className="lq-state__title">{title}</p>
        {body ? <p className="lq-state__body">{body}</p> : null}
        {note ? <p className="lq-hint lq-state__note">{note}</p> : null}
      </div>
      {actions ? <div className="lq-state__acts">{actions}</div> : null}
    </div>
  );
}
