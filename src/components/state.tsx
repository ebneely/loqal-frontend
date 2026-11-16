/**
 * The screens with nothing on them.
 *
 * A storefront has four of these and they are the four moments a shopper is
 * most likely to leave: the API is down, the search found nothing, the address
 * is wrong, the render threw. Every one is the same composition — a large
 * display title at the inline start, one muted paragraph of what happened and
 * what to do, then the actions — so an empty bag and a failed render read as
 * the same calm voice rather than as the site falling over.
 *
 * NO DRAWING. The approved design states these in type alone; `art` and `seed`
 * stay in the props so no caller has to change, and a caller that brings its
 * own picture still passes it as `artwork`.
 *
 * NO HOOKS AND NO CONTEXT anywhere in this file, deliberately. `not-found.tsx`
 * is a server component and `global-error.tsx` renders when the root layout —
 * providers and all — has already thrown. A rescue screen that needs a provider
 * cannot rescue anything.
 */

export type StateArtKind = "crooked" | "slipped" | "shelf";

/**
 * `actions` is a slot rather than a list of hrefs because the action is
 * genuinely different every time — a retry is a button that calls `reset`, a
 * dropped filter is a button that calls `setFilters`, and a way out is a link.
 */
export function EmptyState({
  artwork,
  title,
  body,
  note,
  actions,
  tone = "quiet",
  size = "inline",
  role,
}: {
  /** Kept for the callers; the design no longer draws it. */
  art: StateArtKind;
  seed?: string;
  /** A picture of the caller's own, drawn above the title. */
  artwork?: React.ReactNode;
  title: React.ReactNode;
  body?: React.ReactNode;
  /** A reference number, a slug, the thing support would ask for. */
  note?: React.ReactNode;
  actions?: React.ReactNode;
  /** `loud` marks a failure. Failures only. */
  tone?: "quiet" | "loud";
  /** `page` is a state that IS the screen, with no rail or column beside it. */
  size?: "inline" | "page";
  /** `alert` on a failure, so a screen reader hears it without a reload. */
  role?: "alert" | "status";
}) {
  return (
    <div className="lq-state" data-tone={tone} data-size={size} role={role}>
      {artwork ?? null}
      <h2 className="lq-state__title">{title}</h2>
      {body ? <p className="lq-state__body">{body}</p> : null}
      {note ? <p className="lq-hint lq-state__note">{note}</p> : null}
      {actions ? <div className="lq-state__acts">{actions}</div> : null}
    </div>
  );
}
