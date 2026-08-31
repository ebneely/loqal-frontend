"use client";

/**
 * "Try again", on a server-rendered page.
 *
 * `error.tsx` gets `reset()`, which re-renders the failed segment in place. A
 * page that CAUGHT its own failure — `/shops`, `/categories`, the shop rail on
 * the home screen — never reached a boundary, so there is nothing to reset: the
 * HTML it is rendering is the answer, and the only way to ask again is to ask
 * the server again.
 *
 * So this is a real document reload, and it is the smallest client component in
 * the app because that is all it needs to be. The alternative was telling the
 * shopper to pull down and refresh, which is an instruction where a button
 * belongs.
 */
export function ReloadButton({
  children,
  className = "lq-btn lq-btn--primary",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button type="button" className={className} onClick={() => window.location.reload()}>
      {children}
    </button>
  );
}
