"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Six boxes for a six-digit code, and the typing rules that go with them.
 *
 * ONE COPY, because there are two places a code is entered — signing in, and
 * keeping your number after an order — and the rules are fiddly enough that two
 * copies would drift: type forward, backspace walks back, a pasted code fills
 * every box, and the sixth digit IS the submit. A confirm button under a full
 * code is a step that exists only to be pressed.
 *
 * LTR ALWAYS. A six-digit code is a number; mirroring it under Arabic would
 * reverse what the shopper is copying off their screen.
 */
export const CODE_LENGTH = 6;

export function CodeBoxes({
  /** Bumped by the caller to clear the boxes — a rejected code, or a resend. */
  resetKey = 0,
  ...rest
}: {
  onComplete: (code: string) => void;
  pending?: boolean;
  autoFocus?: boolean;
  resetKey?: number;
}) {
  /* Cleared by REMOUNTING rather than by an effect that writes state: a
     `setState` in an effect is a second render pass for every reset, and React
     rightly complains about it. The key is the whole implementation. */
  return <Boxes key={resetKey} {...rest} />;
}

function Boxes({
  onComplete,
  pending = false,
  autoFocus = false,
}: {
  onComplete: (code: string) => void;
  pending?: boolean;
  autoFocus?: boolean;
}) {
  const [code, setCode] = useState<string[]>(() => Array<string>(CODE_LENGTH).fill(""));
  const boxes = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (autoFocus) window.setTimeout(() => boxes.current[0]?.focus(), 60);
  }, [autoFocus]);

  const put = (index: number, raw: string) => {
    const digits = raw.replace(/\D/g, "");

    // More than one digit means a paste — or a phone's own SMS autofill, which
    // drops the whole code into whichever box has focus.
    if (digits.length > 1) {
      const spread = digits.slice(0, CODE_LENGTH).split("");
      const next = Array<string>(CODE_LENGTH).fill("");
      spread.forEach((value, at) => (next[at] = value));
      setCode(next);
      boxes.current[Math.min(spread.length, CODE_LENGTH - 1)]?.focus();
      if (spread.length === CODE_LENGTH) onComplete(next.join(""));
      return;
    }

    const next = [...code];
    next[index] = digits;
    setCode(next);
    if (digits && index < CODE_LENGTH - 1) boxes.current[index + 1]?.focus();

    const full = next.join("");
    if (full.length === CODE_LENGTH && !next.includes("")) onComplete(full);
  };

  return (
    <div className="lq-code" dir="ltr">
      {code.map((value, index) => (
        <input
          key={index}
          ref={(node) => {
            boxes.current[index] = node;
          }}
          className="lq-code__box"
          inputMode="numeric"
          // Only the first box asks for the one-time code, so a phone offering
          // to fill it does not offer six times.
          autoComplete={index === 0 ? "one-time-code" : "off"}
          maxLength={CODE_LENGTH}
          value={value}
          data-filled={value ? "true" : undefined}
          disabled={pending}
          aria-label={`${index + 1}`}
          onChange={(event) => put(index, event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Backspace" && !value && index > 0) {
              boxes.current[index - 1]?.focus();
            }
          }}
        />
      ))}
    </div>
  );
}
