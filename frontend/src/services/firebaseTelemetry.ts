import { initializeApp, type FirebaseApp } from "firebase/app";
import { forceWebSockets, getDatabase, onValue, ref, type Database } from "firebase/database";

let app: FirebaseApp | null = null;
let db: Database | null = null;

export function initFirebaseFromEnv(): Database | null {
  const url = import.meta.env.VITE_FIREBASE_DATABASE_URL;
  const apiKey = import.meta.env.VITE_FIREBASE_WEB_API_KEY;
  if (!url || !apiKey) return null;
  if (!app) {
    try {
      app = initializeApp({
        apiKey,
        databaseURL: url,
      });
      forceWebSockets();
      db = getDatabase(app);
    } catch {
      app = null;
      db = null;
      return null;
    }
  }
  return db;
}

export type LiveSample = { lap: number; lap_time_s: number; tyre_wear_pct: number };

export function subscribeLiveTelemetry(path: string, cb: (v: LiveSample | null) => void): () => void {
  const database = initFirebaseFromEnv();
  if (!database) {
    cb(null);
    return () => {};
  }
  const r = ref(database, path);
  const unsub = onValue(r, (snap) => {
    cb((snap.val() as LiveSample | null) ?? null);
  });
  return unsub;
}
