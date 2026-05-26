import { useAuthState } from "react-firebase-hooks/auth";
import { auth, firebaseReady } from "../lib/firebase";

/**
 * Hook to get the current Firebase user if it exists.
 * Returns { user, loading, error }.
 * If Firebase is not configured, returns { user: null, loading: false }.
 */
export function useOptionalAuthUser() {
  // If firebase is not configured, return null/false immediately
  if (!firebaseReady || !auth) {
    return { user: null, loading: false, error: undefined };
  }

  const [user, loading, error] = useAuthState(auth);
  return { user, loading, error };
}
