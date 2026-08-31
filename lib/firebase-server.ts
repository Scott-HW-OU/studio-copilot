import { createRemoteJWKSet, decodeJwt, decodeProtectedHeader, jwtVerify } from "jose";
import { NextResponse } from "next/server";

const firebaseKeys = createRemoteJWKSet(
  new URL("https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com")
);

export interface AuthenticatedUser {
  uid: string;
  email: string;
  name?: string;
}

export function authError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function authenticateRequest(request: Request): Promise<AuthenticatedUser | NextResponse> {
  const projectId = process.env.FIREBASE_AUTH_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT;
  if (!projectId) return authError("Firebase Authentication is not configured.", 503);
  const token = request.headers.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) return authError("Sign in is required.", 401);
  try {
    const { payload } = await jwtVerify(token, firebaseKeys, {
      algorithms: ["RS256"],
      audience: projectId,
      issuer: `https://securetoken.google.com/${projectId}`
    });
    const email = typeof payload.email === "string" ? payload.email.toLowerCase() : "";
    if (!payload.sub || !email || payload.email_verified !== true) {
      return authError("A verified email address is required.", 403);
    }
    const allowed = (process.env.STUDIOCOPILOT_ALLOWED_EMAILS || "")
      .split(/[;,]/).map((value) => value.trim().toLowerCase()).filter(Boolean);
    if (allowed.length === 0) return authError("The StudioCopilot account allowlist is not configured.", 503);
    if (!allowed.includes(email)) {
      return authError("This account is not authorised for StudioCopilot.", 403);
    }
    return { uid: payload.sub, email, name: typeof payload.name === "string" ? payload.name : undefined };
  } catch (error) {
    let tokenMetadata: { audience?: string; issuer?: string; keyId?: string } = {};
    try {
      const claims = decodeJwt(token);
      const header = decodeProtectedHeader(token);
      tokenMetadata = {
        audience: Array.isArray(claims.aud) ? claims.aud.join(",") : claims.aud,
        issuer: claims.iss,
        keyId: header.kid
      };
    } catch {
      tokenMetadata = { audience: "unreadable", issuer: "unreadable", keyId: "unreadable" };
    }
    console.error("Firebase ID token verification failed", {
      errorName: error instanceof Error ? error.name : "UnknownError",
      errorCode: typeof error === "object" && error && "code" in error ? String(error.code) : "unknown",
      ...tokenMetadata
    });
    return authError("Your session is invalid or expired. Please sign in again.", 401);
  }
}
