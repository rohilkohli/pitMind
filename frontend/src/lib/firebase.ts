import { initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, type Auth } from "firebase/auth";
import { forceWebSockets, getDatabase, type Database } from "firebase/database";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || import.meta.env.VITE_FIREBASE_WEB_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

function hasFirebaseConfig(): boolean {
  return Boolean(firebaseConfig.apiKey);
}

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let database: Database | null = null;

if (hasFirebaseConfig()) {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  forceWebSockets();
  if (firebaseConfig.databaseURL) {
    database = getDatabase(app);
  }
}

export const firebaseReady = Boolean(app);
export { auth, database };
export const googleProvider = new GoogleAuthProvider();
