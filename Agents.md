# AGENTS.md — Typebot × Facebook Messenger Integration Briefing

> **Read this entire file before generating any plan.** It contains verified facts
> about this codebase. Do not rely on assumptions — the file paths, fix statuses,
> and architecture described here are confirmed correct.

---

## 1. What This Project Is

A self-hosted SaaS chatbot platform built on a **forked Typebot monorepo**.
The custom addition is a **Facebook Messenger channel** (called the TB-to-FBM-bridge),
bridging Facebook webhook events into the Typebot flow engine.
The goal is feature parity with ManyChat/Botpress for the Messenger channel.

---

## 2. Infrastructure — Understand This Before Touching Any File

- **Source code** lives in this repository. The production server does **not** contain source code.
- **Deployment** is fully automated: every push to `main` triggers GitHub Actions, which builds
  two Docker images (`builder` and `viewer`), pushes them to GHCR, SSHes into the DigitalOcean
  droplet at `134.209.179.191`, and recreates the containers via `docker compose up -d --pull always`.
- **You do not need to do anything to deploy.** Commit and push — Actions handles the rest.
- Build takes ~5–8 minutes. The viewer build confirms the webhook route is live:
  `/api/v1/workspaces/[workspaceId]/messenger/[credentialsId]/webhook`

### Live URLs
- Builder: `https://typebotbuilder.orbit265.me` (nginx → port 3000)
- Viewer: `https://typebotviewer.orbit265.me` (nginx → port 3001)
- Messenger webhook: `https://typebotviewer.orbit265.me/api/v1/workspaces/{workspaceId}/messenger/{credentialsId}/webhook`

### Container names (for log inspection)
- `typebot-builder-1`
- `typebot-viewer-1`
- `typebot-postgres-1`

### Tech Stack
- **Runtime:** Bun
- **Framework:** Next.js 15 (App Router)
- **API layer:** oRPC with Zod schemas
- **Database ORM:** Prisma (PostgreSQL 14)
- **Monorepo:** Turborepo
- **Hosting:** DigitalOcean, Ubuntu 22.04, 2 vCPU / 4 GB RAM, London region

---

## 3. Key Files — Verified Correct Paths

> ⚠️ A previous AI analysis cited wrong paths. The paths below are confirmed correct.
> All paths are relative to the repo root.

### Messenger integration package
| File | Purpose |
|---|---|
| `packages/messenger/src/api/router.ts` | Registers `chatMessengerRouter` with oRPC |
| `packages/messenger/src/api/handleMessengerIncomingMessage.ts` | Core handler: extracts psid + text, calls `resumeMessengerFlow` |
| `packages/messenger/src/api/handleMessengerVerification.ts` | Handles Facebook GET webhook verification |
| `packages/messenger/src/resumeMessengerFlow.ts` | Looks up session, calls flow engine, sends reply |
| `packages/messenger/src/sendMessengerMessage.ts` | Calls Facebook Graph API to send messages |
| `packages/messenger/src/schemas.ts` | Zod schemas for incoming Facebook webhook payload |
| `packages/messenger/src/constants.ts` | `WEBHOOK_SUCCESS_MESSAGE` and other constants |

### Webhook route (Next.js App Router)
| File | Purpose |
|---|---|
| `apps/viewer/src/app/api/v1/workspaces/[workspaceId]/messenger/[credentialsId]/webhook/route.ts` | The Next.js route handler (GET verification + POST incoming messages) |
| `apps/viewer/src/app/api/[[...rest]]/router.ts` | Main oRPC viewer router — `chatMessengerRouter` is registered here |

### Builder preview files (for Task 7 only)
| File | Purpose |
|---|---|
| `apps/builder/src/features/preview/components/PreviewDrawerBody.tsx` | Preview dropdown (Web / WhatsApp / API) |
| `apps/builder/src/features/preview/data.tsx` | `runtimes` array — add Messenger entry here |
| `apps/builder/src/features/preview/components/WhatsAppPreviewInstructions.tsx` | Template to copy for Messenger preview |
| `apps/builder/src/components/logos/WhatsAppLogo.tsx` | Template to copy for MessengerLogo |

---

## 4. What Is Already Fixed — DO NOT Re-Implement

> ⚠️ These fixes are confirmed live in production. **Read the current file content
> before editing any file.** Do not overwrite working code.

The following are already present and deployed in `route.ts`:

- ✅ **POST handler** — fully implemented (previously returned 405)
- ✅ **Echo filter** — `if (messaging.message?.is_echo) continue;`
- ✅ **Fire-and-forget** — flow execution wrapped in Next.js `after()`, returns `200 EVENT_RECEIVED` immediately
- ✅ **Text-only guard** — `if (psid && text)` filters delivery/read receipts
- ✅ **Router registered** — `chatMessengerRouter` imported in `apps/viewer/src/app/api/[[...rest]]/router.ts`
- ✅ **`resumeMessengerFlow` exported** from `packages/messenger/package.json`
- ✅ **Facebook Messenger block** registered in forge `credentials.ts` and `constants.ts`

### Confirmed current state of route.ts (do not overwrite this):
```typescript
import { env } from '@typebot.io/env';
import { resumeMessengerFlow } from '@typebot.io/messenger/resumeMessengerFlow';
import { after, NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');
  if (mode === 'subscribe' && token === env.MESSENGER_VERIFY_TOKEN && challenge) {
    return new NextResponse(challenge, { status: 200, headers: { 'Content-Type': 'text/plain' } });
  }
  return new NextResponse('Forbidden', { status: 403 });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; credentialsId: string }> }
) {
  const { workspaceId, credentialsId } = await params;
  const body = await request.json();
  after(async () => {
    for (const entry of body.entry ?? []) {
      for (const messaging of entry.messaging ?? []) {
        if (messaging.message?.is_echo) continue;
        const psid = messaging.sender?.id;
        const text = messaging.message?.text ?? messaging.postback?.payload;
        if (psid && text) {
          await resumeMessengerFlow({ psid, text, workspaceId, credentialsId })
            .catch((err) => console.error('[Messenger] resumeMessengerFlow error', err));
        }
      }
    }
  });
  return new NextResponse('EVENT_RECEIVED', { status: 200 });
}
```

---

## 5. What Is Still Broken

### [CRITICAL] Bug 1 — Session Persistence Failure
- **Symptom:** Bot sends the greeting on every message instead of advancing the flow.
- **File:** `packages/messenger/src/resumeMessengerFlow.ts`
- **Cause:** `psid` is not being correctly used as the persistent user identifier for session lookup.
- **Fix:** Compare with `packages/whatsapp/src/resumeWhatsAppFlow.ts` — the WhatsApp version
  correctly maps a phone number to a session. Mirror that exact pattern using `psid` instead.
  Ensure existing sessions are resumed, not recreated.

### [CRITICAL] Bug 2 — 'Invalid Message' Sent to Users
- **Symptom:** The bot sends the literal text "Invalid Message" to users in Messenger.
- **Root cause:** `resumeMessengerFlow` calls the flow engine, but if the flow contains only a
  forge block with no Text bubble or Choice input, the engine returns nothing. The error path
  forwards raw error text to the user instead of failing gracefully.
- **Fix (two parts):**
  1. Harden `resumeMessengerFlow.ts` — if the flow engine returns no messages, log internally
     (`console.warn('[FBM] Flow returned no messages for psid:', psid)`) and do NOT send anything
     to the user. Never forward raw error strings via the Messenger API.
  2. If the flow engine throws, send a safe neutral reply: `'Sorry, something went wrong. Please try again.'`

### [MAJOR] Bug 3 — No Message-ID Deduplication
- **Symptom:** Facebook retries can cause the same message to be processed twice (duplicate bot responses).
- **File:** `route.ts`
- **Fix:** Before calling `resumeMessengerFlow`, check if `messaging.message.mid` has already been
  processed. Store processed `mid` values in the database with a 24-hour TTL. Add a Prisma migration
  for a `ProcessedMessengerMessage` table with columns: `id`, `mid` (unique string), `createdAt` (DateTime).

### [MAJOR] Missing structured logging
- **Fix:** Add `export const LOG_PREFIX = '[FBM-BRIDGE]'` to `packages/messenger/src/constants.ts`.
  Use it consistently across all `console.log/warn/error` calls in the messenger package.
  Each log should include the `psid` for traceability.

### [CONFIG — not a code task] Facebook webhook URL not registered
- The webhook URL must be set in the Meta Developer Portal → Messenger → Webhooks.
- URL: `https://typebotviewer.orbit265.me/api/v1/workspaces/{workspaceId}/messenger/{credentialsId}/webhook`
- Subscribe to: `messages`, `messaging_postbacks`
- Do NOT subscribe to: `message_deliveries`, `message_reads`, `message_echoes`

### [MINOR] No Messenger preview in builder
- The preview dropdown only has Web / WhatsApp / API.
- Needs a Messenger option modelled on the WhatsApp preview implementation.
- See builder preview files table in Section 3.

---

## 6. Task List — Work Through These in Order

> Complete one task per session. After each task, commit with the message shown
> and push to main. Wait for the GitHub Actions build to succeed before starting the next task.

### Phase 1: Core Stability

**Task 1 — Fix session persistence**
- File: `packages/messenger/src/resumeMessengerFlow.ts`
- Reference: `packages/whatsapp/src/resumeWhatsAppFlow.ts`
- Map `psid` to session the same way WhatsApp maps phone number to session.
- Add: `console.log('[FBM] resumeMessengerFlow', { psid, workspaceId })`
- Commit: `fix: restore session persistence in resumeMessengerFlow`
- Test: Send two consecutive messages — the bot must advance the flow on the second message.

**Task 2 — Fix 'Invalid Message' / harden flow output**
- File: `packages/messenger/src/resumeMessengerFlow.ts`
- Never forward empty or error output to the user via the Messenger API.
- Log empty responses internally. Send a safe fallback if the engine throws.
- Commit: `fix: guard against empty flow output and prevent raw error forwarding`

**Task 3 — Add message-ID deduplication**
- File: `route.ts` + new Prisma migration
- Check `messaging.message.mid` against a `ProcessedMessengerMessage` DB table before processing.
- Skip silently (still return 200) if already seen. Store new mids with `createdAt` timestamp.
- Commit: `feat: add mid-based deduplication to prevent duplicate message processing`

**Task 4 — Add structured logging**
- Files: all of `packages/messenger/src/`
- Add `LOG_PREFIX = '[FBM-BRIDGE]'` to constants and use it everywhere.
- Include `psid` in every log line.
- Commit: `feat: add structured [FBM-BRIDGE] logging across messenger package`

### Phase 2: Features

**Task 5 — End-to-end test (verification task, no code)**
After Tasks 1–4 are deployed:
1. Send 'Hello' to the Orbit 265 Facebook page from a personal account.
2. Expect: bot responds correctly (not 'Invalid Message', not repeated greeting).
3. Reply again — bot must advance the flow.
4. Check logs: `docker logs typebot-viewer-1 --tail 200 2>&1 | grep FBM`

**Task 6 — Add Messenger preview to builder**
- Create `apps/builder/src/components/logos/MessengerLogo.tsx` (copy WhatsAppLogo.tsx, replace SVG)
- Edit `apps/builder/src/features/preview/data.tsx` — add Messenger to `runtimes` array
- Create `apps/builder/src/features/preview/components/MessengerPreviewInstructions.tsx`
  (copy WhatsAppPreviewInstructions.tsx, replace phone input with PSID input)
- Edit `apps/builder/src/features/preview/components/PreviewDrawerBody.tsx` — add Messenger case
- Commit: `feat: add Facebook Messenger preview option to builder`

**Task 7 — Add attachment support to Messenger schema**
- File: `packages/messenger/src/schemas.ts`
- Add optional `message.attachments` array (type + payload.url).
- In `handleMessengerIncomingMessage.ts`: if attachments present but no text,
  pass `'[image: {url}]'` as the text value.
- Commit: `feat: add attachment support to Messenger schema`

---

## 7. Environment Variables (Already Set — Do Not Change)

| Variable | Location | Purpose |
|---|---|---|
| `MESSENGER_VERIFY_TOKEN` | docker-compose.yml (viewer) | Must match Meta Developer Portal webhook token |
| `FACEBOOK_PAGE_ACCESS_TOKEN` | docker-compose.yml (viewer) | Graph API token used by `sendMessengerMessage.ts` |
| `DATABASE_URL` | docker-compose.yml (both) | PostgreSQL connection to `typebot-postgres-1` |
| `NEXTAUTH_SECRET` | docker-compose.yml (builder) | Auth secret |
| `ENCRYPTION_SECRET` | docker-compose.yml (both) | Credential encryption |

---

## 8. Rules Jules Must Follow

1. **Read the current content of any file before editing it.** Many fixes are already applied.
2. **Do not re-implement anything listed in Section 4.**
3. **One task per session.** Do not batch multiple tasks into one PR.
4. **After every change, verify the GitHub Actions build succeeds** before the task is considered done.
5. **Never send raw error strings to Facebook users** via the Messenger API.
6. **Mirror the WhatsApp package patterns** when in doubt — the WhatsApp integration is the reference implementation.