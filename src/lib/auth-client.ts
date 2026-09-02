"use client";

/**
 * The Better Auth browser client.
 *
 * ONE AUTH SERVER, NOT TWO. Better Auth lives in the Nest backend
 * (`core/auth/auth.instance.ts`) and owns the user, session, account and
 * verification tables for the whole platform. The storefront does NOT stand up
 * its own instance — a shopper and a shop owner are rows in the same table, and
 * a second server would mean two session cookies, two secrets and two places to
 * revoke.
 *
 * No baseURL is set, for the same reason as the dashboard: every call goes to
 * /api/auth/... on this origin, through the BFF proxy, so the session cookie is
 * first-party — no SameSite=None, no cookie Domain, no CORS entry, and the API
 * origin never reaches the browser bundle.
 */
import { createAuthClient } from "better-auth/react";
import {
  inferAdditionalFields,
  phoneNumberClient,
} from "better-auth/client/plugins";

/**
 * The three columns the backend adds to Better Auth's user table.
 *
 * All three are declared `input: false` on the server: server-set, readable by
 * a client and settable by none. The storefront never offers to change any of
 * them, because the API would refuse.
 */
export const authClient = createAuthClient({
  basePath: "/api/auth",
  plugins: [
    /**
     * The phone route: `sendOtp` then `verify`, both on the backend's own Better
     * Auth instance. Whether this deployment can actually deliver a code is a
     * separate question, answered by /v1/auth/methods — the client plugin only
     * gives the screen the two calls to make.
     */
    phoneNumberClient(),
    inferAdditionalFields({
      user: {
        role: { type: "string", input: false },
        brandId: { type: "string", required: false, input: false },
        mustChangePassword: { type: "boolean", input: false },
      },
    }),
  ],
});

export const { signIn, signOut, signUp, getSession } = authClient;

export type SessionUser = typeof authClient.$Infer.Session.user;
export type Session = typeof authClient.$Infer.Session;

/**
 * The storefront does NOT gate on role.
 *
 * A shop owner buying a shirt from another shop is an ordinary customer, and
 * refusing them here would be inventing a rule the API does not have. The
 * dashboard is the surface with a role guard, because a console genuinely is
 * for one role; a shop is for everyone.
 */
export function useSession() {
  return authClient.useSession();
}
