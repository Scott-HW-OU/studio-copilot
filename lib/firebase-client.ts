import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

export const firebaseConfigured = Boolean(
  process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
  process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN &&
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
);

const app = getApps()[0] || initializeApp({
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "configuration-required",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "configuration-required.invalid",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "configuration-required"
});

export const clientAuth = getAuth(getApps().length ? getApp() : app);
