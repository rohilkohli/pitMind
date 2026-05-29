import { useEffect, useState } from "react";
import { type User } from "firebase/auth";
import { auth, firebaseReady } from "../lib/firebase";

/**
 * Hook to get the current Firebase user if it exists.
 * Returns { user, loading, error }.
 * If Firebase is not configured, returns { user: null, loading: false }.
 */
export function useOptionalAuthUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(Boolean(firebaseReady && auth));
  const [error, setError] = useState<Error | undefined>(undefined);

  useEffect(() => {
    if (!firebaseReady || !auth) {
      setUser(null);
      setLoading(false);
      setError(undefined);
      return;
    }

    const unsubscribe = auth.onAuthStateChanged(
      (nextUser) => {
        setUser(nextUser);
        setLoading(false);
      },
      (nextError) => {
        setError(nextError);
        setLoading(false);
      },
    );

    return unsubscribe;
  }, []);

  return { user, loading, error };
}
