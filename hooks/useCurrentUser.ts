// hooks/useCurrentUser.ts
"use client"; // Hooks interacting with client-side state/context need this

import { useSession } from "next-auth/react";
import { type Session } from "next-auth"; // Import Session type if needed

/**
 * Custom hook to retrieve the current authenticated user on the client side.
 * Provides direct access to the user object from the session context.
 * Remember to wrap your app or relevant layout in <SessionProvider>.
 *
 * @returns {Session['user'] | null | undefined}
 *          - `Session['user']`: The user object if authenticated.
 *          - `null`: If the session is definitively unauthenticated.
 *          - `undefined`: If the session status is 'loading'.
 */
export const useCurrentUser = (): Session['user'] | null | undefined => {
  const { data: session, status } = useSession();

  // You might want to handle the 'loading' state differently,
  // but returning undefined is common until loaded.
  if (status === "loading") {
    return undefined;
  }

  // If authenticated, return the user object (which includes id/role via augmentation)
  // If unauthenticated, session?.user will be null/undefined, so return null.
  return session?.user ?? null;
};

/**
 * Optional: If you frequently need the status along with the user.
 */
export const useCurrentUserWithStatus = () => {
    const { data: session, status } = useSession();
    return { user: session?.user ?? null, status };
}