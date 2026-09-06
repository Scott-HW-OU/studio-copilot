# StudioCopilot

**Evidence-backed production decisions for film teams.**

StudioCopilot brings scheduling, crew availability, location records, cost exposure, current public-web research, and AI reasoning into one decision workspace. It helps a production manager answer questions such as:

> Can we move Thursday's outdoor shoot to Saturday?

The result is a recommendation with confidence, risks, next actions, specialist findings, and links to the public sources used. StudioCopilot supports the human making the decision; it does not change production records or approve a schedule automatically.

![StudioCopilot decision workspace](public/studiocopilot-devpost-hero.png)

## Judge walkthrough (about 3 minutes)

Use the deployed application link and judge account supplied with the submission. Judge credentials are intentionally not stored in this public repository.

1. **Sign in** with the supplied account. Firebase Authentication protects the workspace and server APIs.
2. In **Command centre**, keep the prepared question — **“Can we move Thursday's outdoor shoot to Saturday?”** — and select **Analyse decision**.
3. Review the recommendation, confidence score, key risks, recommended actions, and the six specialist findings:
   - Production Manager
   - Research
   - Weather & Risk
   - Crew
   - Budget
   - Decision
4. In a live deployment, open the **Parallel research sources** to inspect the evidence behind the answer.
5. Scroll to **Shoot schedule**, **Crew directory**, and **Location directory**. Use **Add new** or the edit control to see the authenticated production-management workflow.
6. Notice the safety boundary: the agent proposes actions for human approval and does not silently rewrite the schedule.

If the result is labelled **DEMO ANALYSIS**, it is a deterministic sample and makes no claim to current weather, permits, or web research. A judged production deployment should be labelled **LIVE ANALYSIS**.

## Why it matters

A seemingly simple schedule change can affect crew availability, equipment hire, permits, weather exposure, transport, and location access. That evidence is normally spread across production records and the public web. StudioCopilot coordinates it into one auditable answer while keeping the production manager in control.

## How it works

```text
Production question
        |
        +--> Firestore production context (schedule, crew, locations, costs)
        +--> Parallel Search API (current public-web evidence and sources)
        |
        v
Gemini on Vertex AI (structured multi-factor reasoning)
        |
        v
Recommendation + confidence + risks + actions + citations
        |
        v
Human review and approval
```

The server runs Parallel research first, then gives that cited evidence and the relevant production data to Gemini. The response is validated and displayed as six understandable specialist findings. Production CRUD APIs are authenticated separately and validated with Zod.

## Main features

- Evidence-backed production decision assistant
- Current web research through the Parallel Search API
- Structured reasoning with Gemini on Vertex AI
- Source links shown alongside live recommendations
- Editable schedule, crew, and location modules backed by Firestore
- Email/password and Google sign-in through Firebase Authentication
- Verified-email and server-side account allowlist enforcement
- Explicit live/demo labelling and fail-closed integration errors
- Responsive production dashboard

## Technology

- Next.js 16, React 19, and TypeScript
- Gemini via the Google Gen AI SDK and Vertex AI
- Parallel Search API via `parallel-web`
- Firebase Authentication
- Google Cloud Firestore
- Cloud Run, Cloud Build, and Artifact Registry
- Zod, Vitest, and ESLint

## Run locally

### Prerequisites

- Node.js 22+
- A Firebase project with Authentication enabled
- Google Cloud Application Default Credentials with access to Vertex AI and Firestore
- A Parallel API key

Install and configure:

```powershell
npm.cmd ci
Copy-Item .env.example .env.local
```

Edit `.env.local` with your own project settings. Never commit secrets or a service-account key.

For live analysis, configure:

```dotenv
GOOGLE_CLOUD_PROJECT=your-project-id
GOOGLE_CLOUD_LOCATION=global
GEMINI_MODEL=gemini-2.5-pro
FIRESTORE_DATABASE_ID=(default)
PARALLEL_API_KEY=your-parallel-api-key
STUDIOCOPILOT_DEMO_MODE=false

NEXT_PUBLIC_FIREBASE_API_KEY=your-firebase-web-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
FIREBASE_AUTH_PROJECT_ID=your-project-id
STUDIOCOPILOT_ALLOWED_EMAILS=judge@example.com
```

Authenticate locally with Google Cloud, then start the app:

```powershell
gcloud.cmd auth application-default login
gcloud.cmd auth application-default set-quota-project your-project-id
npm.cmd run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Demo mode

Set `STUDIOCOPILOT_DEMO_MODE=true` to return the clearly labelled sample decision without calling Gemini or Parallel. Firebase configuration, a verified sign-in, an allowlisted email, and Firestore access are still required for the protected workspace and production modules.

## Validation

Run the project checks with:

```powershell
npm.cmd run lint
npm.cmd run typecheck
npm.cmd test
npm.cmd run build
npm.cmd audit --omit=dev
```

The health endpoint is available at `/api/health`. It reports whether the process is in live or demo mode and whether the required server integrations are configured; it does not expose secret values.

## Security and responsible use

- All decision and production-management endpoints require a verified Firebase ID token.
- The server verifies token signature, issuer, audience, expiry, verified email, and the configured email allowlist.
- Server credentials remain server-side; only Firebase web configuration is exposed to the browser.
- Request bodies are schema-validated before use.
- Missing live integrations fail closed instead of presenting sample data as current evidence.
- Upstream analysis failures state that no production records were changed.
- Recommendations require human review before operational action.

## Repository guide

```text
app/api/decision/                       Coordinated Parallel + Gemini workflow
app/api/productions/[productionId]/     Protected schedule, crew, and location APIs
components/studio-dashboard.tsx         Decision workspace
components/production-modules.tsx       Editable production modules
lib/firebase-server.ts                  Server-side Firebase token verification
lib/parallel.ts                         Public-web research integration
lib/gemini.ts                           Structured decision reasoning
lib/firestore.ts                        Production persistence and decision logs
cloudbuild.yaml                         Cloud Build and Cloud Run deployment
firestore.rules                         Firestore access rules
```

## Licence

This project is released under the [MIT Licence](LICENSE).
