import { z } from "zod";

import { api } from "./api";

/**
 * WHICH WAYS IN THIS DEPLOYMENT HAS.
 *
 * Two of the three are conditional on the API's configuration: Google is
 * mounted only where both halves of its credential are set, and the phone code
 * can only be carried where a WhatsApp gateway credential exists. The sign-in
 * screen draws what this says and nothing else — the alternative is guessing,
 * and a guess is either a Google button that lands on Google's own error page
 * or a phone field that takes a number and sends nothing.
 *
 * `.strict()`, like every other contract here: a key the API stopped sending is
 * a screen quietly losing a way in, and it should fail here instead.
 */
export const authMethodsSchema = z
  .object({
    emailPassword: z.boolean(),
    google: z.boolean(),
    phoneOtp: z.boolean(),
    emailOtp: z.boolean(),
  })
  .strict();

export type AuthMethods = z.infer<typeof authMethodsSchema>;

export const authMethodsKey = ["auth-methods"] as const;

/**
 * Never cached across deployments — it is configuration, and the day a
 * credential is added the screen has to notice on the next load rather than
 * five minutes later. It is three booleans; the request costs nothing.
 */
export function fetchAuthMethods(): Promise<AuthMethods> {
  return api.get(authMethodsSchema, "/v1/auth/methods", { cache: "no-store" });
}

/**
 * What the screen falls back to when the API cannot be reached at all. Email
 * and password is the one route that is always mounted, so offering it is never
 * a lie; offering the other two on a guess would be.
 */
export const EMAIL_ONLY: AuthMethods = {
  emailPassword: true,
  google: false,
  phoneOtp: false,
  emailOtp: false,
};
