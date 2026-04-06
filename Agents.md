# AGENTS.md — Cloned Typebot: Facebook Messenger Integration

> Read this file completely before writing a single line of code.
> Every task below is discrete and bounded. Do not batch tasks unless explicitly told to.
> Do not modify files listed as ALREADY FIXED unless a task explicitly targets them.

---

## 1. PROJECT OVERVIEW

This is a **forked and self-hosted Typebot monorepo** (`mw3407-coder/cloned-typebot`).

Typebot is a visual chatbot builder. The official version supports WhatsApp and web embeds. This fork extends it to support **Facebook Messenger** — a custom integration built from scratch on top of the Meta Messenger Platform API.

**Goal:** Make this fork's Messenger experience match the quality of ManyChat's Messenger features, specifically the ones that are buildable without a Meta Business Partner account. The bot must feel professional to end-users in Malawi who are interacting with it through a Facebook Page inbox.

---

## 2. INFRASTRUCTURE & DEPLOYMENT

| Item | Value |
|------|-------|
| Server | DigitalOcean Ubuntu 22.04, 2vCPU / 4GB RAM |
| IP | 134.209.179.191 (London region) |
| Deployment | Docker Compose + Nginx + SSL |
| CI/CD | GitHub Actions — push to `main` triggers build and deploy automatically |
| Database | PostgreSQL (managed via Prisma ORM) |
| Runtime | Bun (not Node) — use `bun` not `npm` or `node` for all commands |
| Package manager | Bun — lockfile is `bun.lock` |

**When you push a PR and it is merged into `main`, the server automatically rebuilds and redeploys. You do not need to SSH or run any deploy commands.**

---

## 3. MONOREPO STRUCTURE (relevant paths only)

```
apps/
  builder/                        ← Next.js visual flow editor (what the bot-builder uses)
    src/
      app/api/router.ts           ← Builder API router
      components/logos/           ← Channel logos including Messenger
      features/preview/           ← Live preview panel in the builder
        components/
          MessengerPreviewInstructions.tsx   ← Instructions shown in preview drawer
          PreviewDrawerBody.tsx              ← Preview drawer that shows channel options

  viewer/                         ← Next.js runtime that executes bot flows
    src/app/api/v1/workspaces/[workspaceId]/messenger/[credentialsId]/webhook/
      route.ts                    ← Messenger webhook: receives events from Meta, runs flows

packages/
  messenger/src/                  ← All Messenger runtime logic lives here
    api/
      router.ts                   ← Registers the webhook route
    resumeMessengerFlow.ts        ← Executes a Typebot flow and sends output to Messenger
    handleMessengerIncomingMessage.ts  ← Entry point for processing an incoming message
    schemas.ts                    ← Zod schemas for Meta webhook payloads
    constants.ts                  ← Shared constants (LOG_PREFIX, etc.)

  forge/blocks/facebookMessenger/ ← Separate package: the builder block for Messenger credentials
                                    This is NOT the webhook runtime. Do not confuse the two.
```

---

## 4. CURRENT STATE — WHAT IS ALREADY DONE

Do **not** redo or overwrite any of the following. They are confirmed deployed:

| Item | Status | Location |
|------|--------|----------|
| Messenger webhook endpoint | ✅ Working | `apps/viewer/src/app/api/v1/workspaces/[workspaceId]/messenger/[credentialsId]/webhook/route.ts` |
| Echo filter (`is_echo` guard) | ✅ Deployed | `route.ts` |
| Delivery/read receipt guard (`psid && text`) | ✅ Deployed | `route.ts` |
| `after()` fire-and-forget wrapper | ✅ Deployed | `route.ts` |
| `resumeMessengerFlow` try/catch + empty-flow guard | ✅ Deployed | `packages/messenger/src/resumeMessengerFlow.ts` |
| Messenger logo in builder | ✅ In merged PR | `apps/builder/src/components/logos/MessengerLogo.tsx` |
| Messenger preview instructions | ✅ In merged PR | `apps/builder/src/features/preview/components/MessengerPreviewInstructions.tsx` |
| Messenger preview drawer entry | ✅ In merged PR | `apps/builder/src/features/preview/components/PreviewDrawerBody.tsx` |

**Known minor issues NOT blocking further work:**
- Duplicate message events occasionally fire (mid-based deduplication not yet implemented — low priority for now)
- Structured logging with `[FBM-BRIDGE]` prefix not yet consistent — low priority for now

---

## 5. META MESSENGER PLATFORM API — REFERENCE

**Page Access Token:** Stored in environment as `MESSENGER_PAGE_ACCESS_TOKEN` (or equivalent credential stored in Typebot's credential system — check `packages/forge/blocks/facebookMessenger` for the credential schema).

**Graph API base URL:** `https://graph.facebook.com/v19.0`

**Messenger Profile API** (for persistent menu, icebreakers):
```
POST https://graph.facebook.com/v19.0/me/messenger_profile?access_token=PAGE_TOKEN
```

**Send API** (for sending messages to users):
```
POST https://graph.facebook.com/v19.0/me/messages?access_token=PAGE_TOKEN
```

**User Profile API** (for fetching name, locale, timezone from a PSID):
```
GET https://graph.facebook.com/v19.0/{PSID}?fields=name,first_name,last_name,locale,timezone&access_token=PAGE_TOKEN
```

All API calls must use the page access token, not the app token.

---

## 6. TASK LIST — COMPLETE IN ORDER, ONE PR PER TASK

---

### TASK 1 — Verify and fix Messenger Preview in the builder

**Scope:** `apps/builder/src/features/preview/`

**What to do:**
The previous PR added `MessengerPreviewInstructions.tsx` and updated `PreviewDrawerBody.tsx`. Before doing anything else, read those files as they currently exist in the repo. Verify:

1. `PreviewDrawerBody.tsx` includes a Messenger option alongside the existing WhatsApp/web options.
2. `MessengerPreviewInstructions.tsx` renders clear instructions telling the builder-user how to test — specifically: "Open Messenger on your phone, find your Facebook Page, send any message, and the bot will respond."
3. There is a `MessengerLogo.tsx` component that renders the Messenger gradient icon (purple-to-blue gradient, chat bubble shape).

If any of these are missing or incomplete, fix them. If they are all present and correct, make a small, non-breaking improvement to the instruction copy to confirm the task ran, and submit the PR.

**Do NOT touch:** `route.ts`, `resumeMessengerFlow.ts`, or any file outside `apps/builder/src/features/preview/` and `apps/builder/src/components/logos/`.

---

### TASK 2 — Persistent Menu (Hamburger Menu in Messenger)

**Scope:** New builder settings UI + new backend API endpoint

**What this does:** Lets the bot-builder define a hamburger menu that always appears in Messenger conversations. Users tap the ☰ icon in the bottom right of the chat to see it. It's set via Meta's Messenger Profile API and persists until changed.

**Backend — create a new API route:**

File: `apps/builder/src/app/api/messenger/persistent-menu/route.ts`

```typescript
// POST body: { pageAccessToken: string, menuItems: Array<{ title: string, payload?: string, url?: string }> }
// Calls: POST https://graph.facebook.com/v19.0/me/messenger_profile
// Body sent to Meta:
// {
//   "persistent_menu": [{
//     "locale": "default",
//     "composer_input_disabled": false,
//     "call_to_actions": [
//       { "type": "postback", "title": "Menu Item Title", "payload": "MENU_ITEM_1" },
//       { "type": "web_url", "title": "Visit Website", "url": "https://example.com" }
//     ]
//   }]
// }
// Max 3 items on the top level for free pages. Use up to 3.
// Return 200 with { success: true } on success, 400 with error message on failure.
```

**Builder UI — create a settings component:**

File: `apps/builder/src/features/messengerSettings/components/PersistentMenuSettings.tsx`

- Simple form with up to 3 menu item rows
- Each row: Title field (required, max 30 chars) + Type toggle (Postback vs URL) + Payload or URL field
- A "Save & Push to Messenger" button that calls the backend route above
- Success/error toast feedback

Wire this component into the existing Messenger credentials/settings area in the builder (look for where WhatsApp settings or credentials are configured — follow the same pattern).

**Postback handling in webhook:**
In `route.ts`, the webhook currently handles `messaging[].message` events. Meta also sends `messaging[].postback` events when a persistent menu item is tapped. Add handling:
```typescript
if (entry.postback) {
  // treat postback.payload as the incoming "message text" for flow routing
  const text = entry.postback.payload ?? entry.postback.title
  // pass to handleMessengerIncomingMessage with this text
}
```

**Do NOT touch:** `resumeMessengerFlow.ts`, the echo filter, or the `psid && text` guard.

---

### TASK 3 — Conversation Starters (Icebreakers)

**Scope:** New builder settings UI + new backend API endpoint

**What this does:** Sets 1–4 prompt buttons that appear when a user opens a fresh Messenger conversation with the page for the first time (before they've typed anything). These are called "icebreakers" in the Meta API.

**Backend — create:**

File: `apps/builder/src/app/api/messenger/icebreakers/route.ts`

```typescript
// POST body: { pageAccessToken: string, icebreakers: Array<{ question: string, payload: string }> }
// Calls: POST https://graph.facebook.com/v19.0/me/messenger_profile
// Body:
// {
//   "ice_breakers": [
//     { "question": "What phones do you have?", "payload": "PHONES" },
//     { "question": "What are your prices?", "payload": "PRICES" }
//   ]
// }
// Max 4 icebreakers. Each question max 80 chars.
// Return { success: true } on success.
```

**Builder UI:**

File: `apps/builder/src/features/messengerSettings/components/IcebreakerSettings.tsx`

- Up to 4 rows: Question text field + Payload field
- "Save & Push to Messenger" button
- Wire into same Messenger settings area as Task 2

**Postback handling:** Icebreaker taps also fire `postback` events (same payload as set above). The postback handler added in Task 2 already covers this — no additional work needed here.

---

### TASK 4 — Keyword Routing Middleware

**Scope:** `apps/viewer/src/app/api/v1/workspaces/[workspaceId]/messenger/[credentialsId]/webhook/route.ts` + new database table + builder UI

**What this does:** Before running the full Typebot flow, check if the incoming message text matches a keyword. If it does, restart the flow from a specific starting point (or run a specific flow). This is how ManyChat lets users type "PRICE" and instantly jump to a pricing flow.

**Database — add Prisma model:**

```prisma
model MessengerKeywordRoute {
  id           String   @id @default(cuid())
  workspaceId  String
  credentialsId String
  keyword      String   // e.g. "PRICE", "MENU", "HELP" — store uppercase
  typebotId    String   // which typebot flow to trigger
  createdAt    DateTime @default(now())

  @@unique([workspaceId, credentialsId, keyword])
}
```

Add the Prisma migration.

**Webhook middleware in route.ts:**

After extracting `psid` and `text` from the event (and after the existing echo/receipt guards), add:

```typescript
// Keyword routing check
const upperText = text.trim().toUpperCase()
const keywordRoute = await prisma.messengerKeywordRoute.findFirst({
  where: { workspaceId, credentialsId, keyword: upperText }
})
if (keywordRoute) {
  // Start fresh session with the mapped typebot
  // Use type: "new" and the keywordRoute.typebotId
  // then call resumeMessengerFlow
  // return early — skip the normal session continuation below
}
```

**Builder UI:**

File: `apps/builder/src/features/messengerSettings/components/KeywordRoutingSettings.tsx`

- Table of keyword → flow mappings
- Add row: Keyword field + Typebot selector dropdown (list typebots in this workspace)
- Delete row button
- Wire into Messenger settings area

---

### TASK 5 — User Profile Fetching and Storage on First Contact

**Scope:** `packages/messenger/src/handleMessengerIncomingMessage.ts` + new database table

**What this does:** When a PSID is seen for the first time (new user), call the Graph API to get their display name, locale, and timezone, and store it in the database. This is the beginning of customer identity — the foundation of the data intelligence layer.

**Database — add Prisma model:**

```prisma
model MessengerContact {
  id            String   @id @default(cuid())
  psid          String   @unique
  workspaceId   String
  credentialsId String
  firstName     String?
  lastName      String?
  name          String?
  locale        String?
  timezone      Float?
  firstSeenAt   DateTime @default(now())
  lastSeenAt    DateTime @updatedAt
}
```

Add the Prisma migration.

**In `handleMessengerIncomingMessage.ts`:**

```typescript
// After extracting psid, before calling resumeMessengerFlow:
const existingContact = await prisma.messengerContact.findUnique({ where: { psid } })

if (!existingContact) {
  // Fire-and-forget: fetch profile from Graph API
  fetchAndStoreMessengerProfile(psid, workspaceId, credentialsId, pageAccessToken)
    .catch(err => console.warn('[FBM] Failed to fetch user profile:', err))
}
```

Create `packages/messenger/src/fetchMessengerProfile.ts`:
```typescript
// GET https://graph.facebook.com/v19.0/{psid}?fields=name,first_name,last_name,locale,timezone
// On success: upsert MessengerContact record
// On failure: log warning and continue — never throw, never block message handling
```

Also update `lastSeenAt` on every message from an existing contact (simple upsert).

---

### TASK 6 — Verify Quick Reply Button Rendering

**Scope:** `packages/messenger/src/resumeMessengerFlow.ts`

**What this does:** Confirm that Typebot's Choice input block (the button-choice block in the visual editor) maps to Messenger's native `quick_replies` format, not plain text. Quick replies are the pill-shaped disappearing buttons that appear above the keyboard in Messenger.

**Read `resumeMessengerFlow.ts` first.** Find where Choice input / button blocks are converted to outgoing Messenger messages.

If a buttons block is currently sending as plain text (e.g., "Option 1 / Option 2 / Option 3"), fix it to send the proper Messenger `quick_replies` format:

```json
{
  "recipient": { "id": "<PSID>" },
  "message": {
    "text": "Which would you like?",
    "quick_replies": [
      { "content_type": "text", "title": "Option 1", "payload": "OPTION_1" },
      { "content_type": "text", "title": "Option 2", "payload": "OPTION_2" }
    ]
  }
}
```

Max 13 quick replies, max 20 chars per title. If a flow has more than 13 buttons, send the first 13 and add a note to the log.

**Also handle quick reply postback:** When a user taps a quick reply, Meta sends a message event where `message.quick_reply.payload` contains the payload. Ensure the incoming message handler extracts `quick_reply.payload` as the user's response when present.

---

### TASK 7 — Verify Image and Media Bubble Rendering

**Scope:** `packages/messenger/src/resumeMessengerFlow.ts`

**What this does:** Confirm that Typebot's Image bubble and Video bubble blocks send the proper Messenger attachment format, not broken text or raw URLs.

**Image bubble should send:**
```json
{
  "recipient": { "id": "<PSID>" },
  "message": {
    "attachment": {
      "type": "image",
      "payload": { "url": "<IMAGE_URL>", "is_reusable": true }
    }
  }
}
```

**Video bubble should send:**
```json
{
  "attachment": { "type": "video", "payload": { "url": "<VIDEO_URL>" } }
}
```

**Audio bubble should send:**
```json
{
  "attachment": { "type": "audio", "payload": { "url": "<AUDIO_URL>" } }
}
```

Read the current implementation. If any of these bubble types are falling through to plain text, fix the mapping. If they already work correctly, confirm by adding a code comment and submit a PR documenting the finding.

---

## 7. GENERAL RULES FOR ALL TASKS

1. **Read before writing.** Always read the target file(s) before editing them.
2. **One PR per task.** Do not bundle multiple tasks into one PR.
3. **Bun, not npm.** Use `bun install`, `bun run`, `bunx prisma migrate dev` — never `npm` or `npx`.
4. **Prisma migrations.** Any new model requires `bunx prisma migrate dev --name <descriptive-name>`.
5. **Never send raw error strings to users.** If something breaks server-side, the user gets "Sorry, something went wrong. Please try again." — never a stack trace or error object.
6. **Do not touch already-fixed code** unless a task explicitly targets it (see Section 4).
7. **Environment variables** for the Messenger page access token follow Typebot's existing credential pattern — look at how WhatsApp credentials are stored and read, and follow the same approach.
8. **CI note:** There is a `claude-code-review.yml` workflow that will fail on every PR — this is expected and harmless. Ignore it and proceed with submission.

---

## 8. DEFINITION OF DONE

A task is complete when:
- The PR is merged into `main`
- The GitHub Actions build passes (ignoring `claude-code-review`)
- The feature is testable: either via the builder UI (for settings features) or via a real Messenger message to the connected Facebook Page (for webhook features)