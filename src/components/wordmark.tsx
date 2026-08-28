/**
 * The wordmark. There is no logo file and none has been drawn — the mark is
 * the word, and the three a's are the whole of it.
 *
 * A fragment, not an element: every call site already has its own box with its
 * own size and weight, and wrapping one more span around them would mean two
 * places to change a font-size.
 */
export function Wordmark() {
  return (
    <>
      loq<span className="lq-mark__a">aaa</span>l
    </>
  );
}
