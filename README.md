# StudioCopilot

StudioCopilot is an evidence-backed production operations centre for film and television crews. A producer asks a decision question; the application coordinates six specialist perspectives, combines private schedule, crew, and cost records with current public-web research, and returns one actionable recommendation.

**Hackathon track:** Parallel Search API + Google Cloud  
**Platform:** Web  
**AI policy:** Gemini on Vertex AI only. No other model, AI API, or agent framework is used.

## What works

- Responsive dashboard with shoot days, locations, crew coverage, and risk state.
- Six-role workflow: Production Manager, Research, Weather & Risk, Crew, Budget, and Decision.
- Live Parallel Search API call through the official parallel-web SDK.
- Live Gemini 2.5 Pro call on Vertex AI through the official @google/genai SDK.
- Firestore production reads and agent audit-log writes.
- Firebase Authentication with verified email/password and Google sign-in.
- Authenticated Schedule, Crew, and Locations modules with validated CRUD APIs.
- Clickable research sources, confidence, risks, and recommended human actions.
- Explicit demo mode that never presents sample weather or web evidence as live.
- Cloud Run container and Cloud Build deployment definition.

The design uses deterministic orchestration around one Gemini Decision Agent call. Each specialist returns a separately visible finding. This keeps latency and cost suitable for a live demo while retaining clear agent responsibilities.

## Required runtime integrations

- lib/parallel.ts creates the official Parallel client and calls client.beta.search at request time.
- lib/gemini.ts creates a Vertex-backed GoogleGenAI client and calls ai.models.generateContent.
- app/api/decision/route.ts orchestrates Parallel first, passes its cited evidence to Gemini, and returns the combined decision.

Search results are treated as untrusted data, not prompt instructions. The agent may not invent current facts and must defer permit, legal, drone, weather-safety, and final scheduling decisions to official sources and qualified crew.

## Run locally

Prerequisites: Node.js 22, a Google Cloud project with Vertex AI and Firestore enabled, Google Application Default Credentials, and a Parallel API key.

~~~powershell
Copy-Item .env.example .env.local
gcloud auth application-default login
npm.cmd install
npm.cmd run dev
~~~

Set GOOGLE_CLOUD_PROJECT, PARALLEL_API_KEY, the three NEXT_PUBLIC_FIREBASE_* web-app values, and STUDIOCOPILOT_ALLOWED_EMAILS in .env.local, then open http://localhost:3000. Enable Email/Password and Google providers in Firebase Authentication. STUDIOCOPILOT_ALLOWED_EMAILS is a required, semicolon-separated allowlist; an absent list fails closed.

All production and decision APIs require a verified Firebase ID token. The client sends the token as `Authorization: Bearer <token>`; the server verifies its Google signature, issuer, audience, expiry, and verified-email claim. If a production document defines `memberUids`, access is further restricted to those Firebase user IDs.

## Production modules and endpoints

- `GET/POST /api/productions/:productionId/schedule`
- `PATCH/DELETE /api/productions/:productionId/schedule/:itemId`
- `GET/POST /api/productions/:productionId/crew`
- `PATCH/DELETE /api/productions/:productionId/crew/:itemId`
- `GET/POST /api/productions/:productionId/locations`
- `PATCH/DELETE /api/productions/:productionId/locations/:itemId`

Schedule records reference a location and assigned crew. Locations used by a shoot day cannot be deleted. Payloads are bounded and validated with Zod before Firestore writes.

To inspect the interface without cloud credentials, set STUDIOCOPILOT_DEMO_MODE=true. Demo results are labeled and the Research and Weather agents are marked skipped. Do not enable demo mode in the judged deployment.

## Deploy to Google Cloud Run

~~~powershell
gcloud services enable aiplatform.googleapis.com firestore.googleapis.com run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com secretmanager.googleapis.com
gcloud artifacts repositories create studiocopilot --repository-format=docker --location=europe-west2
Set-Content -NoNewline .parallel-secret '<YOUR_PARALLEL_API_KEY>'
gcloud secrets create parallel-api-key --data-file=.parallel-secret
Remove-Item .parallel-secret
$firebaseApiKey = '<FIREBASE_WEB_API_KEY>'
$firebaseProjectId = 'your-firebase-project-id'
$firebaseAuthDomain = "$firebaseProjectId.firebaseapp.com"
$allowedEmails = 'producer@example.com;admin@example.com'
gcloud builds submit --config cloudbuild.yaml --substitutions="_FIREBASE_API_KEY=$firebaseApiKey,_FIREBASE_AUTH_DOMAIN=$firebaseAuthDomain,_FIREBASE_PROJECT_ID=$firebaseProjectId,_ALLOWED_EMAILS=$allowedEmails"
~~~

Grant the Cloud Run runtime service account roles/aiplatform.user, roles/datastore.user, and Secret Manager access to parallel-api-key. Enable Firebase Authentication for the same project and create a Web app before building. The /api/health endpoint reports configuration without exposing credentials.

The supplied public hackathon deployment uses fictional production records. Firebase Authentication protects application APIs, an optional email allowlist limits account access, and `memberUids` enforces production membership. Firestore rules remain deny-by-default; server writes use IAM.

## Validate

~~~powershell
npm.cmd run typecheck
npm.cmd test
npm.cmd run build
~~~

Live integration smoke test:

~~~powershell
$body = @{ message = "Can we move Thursday's outdoor shoot to Saturday?"; productionId = "north-star" } | ConvertTo-Json
Invoke-RestMethod http://localhost:3000/api/decision -Method Post -ContentType application/json -Body $body
~~~

A judged response must have mode live and six agent findings. HTTP 503 means credentials are missing; HTTP 502 means an upstream service failed.

## Three-minute demo flow

1. Show Thursday's exterior shoot and crew coverage.
2. Ask: **Can we move Thursday's outdoor shoot to Saturday?**
3. Show the six agent findings.
4. Open one Parallel source, then show the recommendation, confidence, risks, and actions.
5. Close with: “StudioCopilot turns hours of fragmented production coordination into one evidence-backed decision.”

Keep the video under three minutes, in English, and use only original or licensed material.

## Data and limitations

The repository contains fictional sample data only. Current public-web facts come from Parallel Search and retain source links. No permit submission, payroll, accounting, calendar integration, or automatic schedule mutation is performed. Costs are planning estimates. A human production manager remains accountable for call sheets and operational decisions.

## Submission checklist

- [ ] Deploy the live build to Cloud Run and add its URL to Devpost.
- [ ] Confirm /api/health reports live mode and both integrations configured.
- [ ] Make this repository public and add its URL to Devpost.
- [x] Keep the top-level MIT LICENSE visible.
- [ ] Publish the sub-three-minute YouTube or Vimeo demo.
- [ ] Add every eligible team member, maximum four, to Devpost.
- [ ] Submit before **2:00 PM PT on 9 September 2026**.

## Findings and learnings

Production decisions need provenance more than prose. Parallel supplies current public evidence; Gemini is most useful when constrained to reconcile that evidence with explicit production records. A fail-closed live mode and visibly limited demo mode avoid silently substituting fabricated search or weather data.
