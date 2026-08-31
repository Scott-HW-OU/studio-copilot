"use client";

import { useState } from "react";
import { createUserWithEmailAndPassword, GoogleAuthProvider, sendEmailVerification, signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { Film, LogIn } from "lucide-react";
import { clientAuth, firebaseConfigured } from "@/lib/firebase-client";

export function AuthScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [registering, setRegistering] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function verificationSettings() {
    return { url: `${window.location.origin}/`, handleCodeInApp: false };
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true); setError("");
    try {
      if (registering) {
        const result = await createUserWithEmailAndPassword(clientAuth, email, password);
        await sendEmailVerification(result.user, verificationSettings());
        await clientAuth.signOut();
        setError("Verification email sent. Verify the address, then sign in.");
      } else {
        const result = await signInWithEmailAndPassword(clientAuth, email, password);
        if (!result.user.emailVerified) {
          await sendEmailVerification(result.user, verificationSettings());
          await clientAuth.signOut();
          throw new Error("Verify your email first. A new verification email has been sent.");
        }
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Authentication failed.");
    } finally { setBusy(false); }
  }

  async function signInGoogle() {
    setBusy(true); setError("");
    try { await signInWithPopup(clientAuth, new GoogleAuthProvider()); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Google sign-in failed."); }
    finally { setBusy(false); }
  }

  return <main className="auth-shell">
    <section className="auth-card">
      <div className="auth-brand"><span><Film size={22} /></span><strong>StudioCopilot</strong></div>
      <p className="eyebrow">PRODUCTION ACCESS</p>
      <h1>{registering ? "Create your account" : "Welcome back"}</h1>
      <p>Sign in to manage schedules, crew records, locations and production decisions.</p>
      {!firebaseConfigured && <div className="auth-config">Firebase client configuration is missing. Add the NEXT_PUBLIC_FIREBASE_* variables before signing in.</div>}
      <form onSubmit={submit}>
        <label>Email<input type="email" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} /></label>
        <label>Password<input type="password" required minLength={8} autoComplete={registering ? "new-password" : "current-password"} value={password} onChange={(event) => setPassword(event.target.value)} /></label>
        <button disabled={busy || !firebaseConfigured}><LogIn size={16} />{busy ? "Please wait…" : registering ? "Create account" : "Sign in"}</button>
      </form>
      <button className="google-button" disabled={busy || !firebaseConfigured} onClick={signInGoogle}>Continue with Google</button>
      {error && <div className="auth-message" role="alert">{error}</div>}
      <button className="auth-switch" onClick={() => { setRegistering(!registering); setError(""); }}>
        {registering ? "Already registered? Sign in" : "Need an account? Register"}
      </button>
    </section>
  </main>;
}
