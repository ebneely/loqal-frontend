/**
 * The wordmark. There is no logo file and none has been drawn — the mark is
 * the word, and the three a's are the whole of it: they light up green one
 * after another, then rest (see `.lq-mark__a` in components.css).
 *
 * A fragment, not an element: every call site already has its own box with its
 * own size and weight. Each a is its own span so each can take its own delay;
 * the reader still gets the one word — spans do not break it up for a screen
 * reader or for copy and paste.
 */
export function Wordmark() {
  return (
    <>
      loq
      <span className="lq-mark__a">a</span>
      <span className="lq-mark__a">a</span>
      <span className="lq-mark__a">a</span>l
    </>
  );
}
