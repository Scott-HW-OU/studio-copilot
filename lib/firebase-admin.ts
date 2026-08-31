import { applicationDefault, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { NextResponse } from "next/server";

const adminApp = getApps()[0] || initializeApp({
  credential: applicationDefault(),
  projectId: process.env.GOOGLE_CLOUD_PROJECT
});

export const adminAuth = getAuth(adminApp);

export interface AuthenticatedUser {
  uid: string;
  email: string;
  name?: string;
}

export function authError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function authenticateRequest(request: Request): Promise<AuthenticatedUser | NextResponse> {
  const token = request.headers.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) return authError("Sign in is required.", 401);
  try {
    const decoded = await adminAuth.verifyIdToken(token, true);
    const email = decoded.email?.toLowerCase();
    if (!email || !decoded.email_verified) return authError("A verified email address is required.", 403);
    const allowed = (process.env.STUDIOCOPILOT_ALLOWED_EMAILS || "")
      .split(",").map((value) => value.trim().toLowerCase()).filter(Boolean);
    if (allowed.length > 0 && !allowed.includes(email)) return authError("This account is not authorised for StudioCopilot.", 403);
    return { uid: decoded.uid, email, name: decoded.name };
  } catch {
    return authError("Your session is invalid or expired. Please sign in again.", 401);
  }
}
