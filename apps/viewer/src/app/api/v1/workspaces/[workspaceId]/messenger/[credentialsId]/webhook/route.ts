// ─────────────────────────────────────────────────────────────────────────────
// apps/viewer/src/app/api/v1/workspaces/[workspaceId]/messenger/[credentialsId]/webhook/route.ts
//
// Handles ALL Facebook Messenger webhook event types:
//   - text messages
//   - postback (button template taps, persistent menu taps, Get Started)
//   - quick_reply (chip taps)
//   - attachments (images, audio etc sent by user — treated as text prompt)
//   - echo (own messages — ignored)
//   - delivery / read receipts — ignored
//   - feed (comment triggers) — scaffolded
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@typebot.io/prisma";
import { decrypt } from "@typebot.io/lib/encryption/decrypt";
import { resumeMessengerFlow } from "@typebot.io/messenger/resumeMessengerFlow";

// ── Verify request came from Facebook ────────────────────────────────────────

function verifySignature(
  rawBody: string,
  signature: string | null,
  appSecret: string
): boolean {
  if (!signature) return false;
  const expected =
    "sha256=" +
    crypto.createHmac("sha256", appSecret).update(rawBody).digest("hex");
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}

// ── GET: Webhook verification ─────────────────────────────────────────────────

export async function GET(
  req: NextRequest,
  { params }: { params: { workspaceId: string; credentialsId: string } }
) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const credentials = await prisma.credentials.findFirst({
    where: { id: params.credentialsId, workspaceId: params.workspaceId },
  });
  if (!credentials) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const data = await decrypt(credentials.data, credentials.iv);
  const verifyToken = (data as any).verifyToken;

  if (mode === "subscribe" && token === verifyToken) {
    return new NextResponse(challenge, { status: 200 });
  }
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

// ── POST: Incoming events ─────────────────────────────────────────────────────

export async function POST(
  req: NextRequest,
  { params }: { params: { workspaceId: string; credentialsId: string } }
) {
  const rawBody = await req.text();

  const credentials = await prisma.credentials.findFirst({
    where: { id: params.credentialsId, workspaceId: params.workspaceId },
  });
  if (!credentials) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const data = await decrypt(credentials.data, credentials.iv);
  const { pageAccessToken, appSecret } = data as {
    pageAccessToken: string;
    appSecret?: string;
    verifyToken: string;
  };

  // Optionally verify signature
  if (appSecret) {
    const sig = req.headers.get("x-hub-signature-256");
    if (!verifySignature(rawBody, sig, appSecret)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
    }
  }

  const body = JSON.parse(rawBody);
  if (body.object !== "page") {
    return NextResponse.json({ error: "Not a page event" }, { status: 400 });
  }

  // Process entries in background — return 200 immediately (FB requires it)
  (async () => {
    for (const entry of body.entry ?? []) {

      // ── Comment / Feed events ────────────────────────────────────────────
      if (entry.changes) {
        for (const change of entry.changes) {
          if (change.field === "feed") {
            await handleFeedEvent(change.value, pageAccessToken, params);
          }
        }
        continue;
      }

      // ── Messenger events ─────────────────────────────────────────────────
      for (const event of entry.messaging ?? []) {
        await handleMessagingEvent(event, pageAccessToken, params);
      }
    }
  })().catch((err) => console.error("[Messenger] Webhook handler error:", err));

  return NextResponse.json({ status: "ok" });
}

// ── Messaging event handler ───────────────────────────────────────────────────

async function handleMessagingEvent(
  event: any,
  pageAccessToken: string,
  params: { workspaceId: string; credentialsId: string }
) {
  const psid: string | undefined = event.sender?.id;
  if (!psid) return;

  // Ignore echoes (messages sent BY the page)
  if (event.message?.is_echo) return;

  // Ignore delivery and read receipts
  if (event.delivery || event.read) return;

  // ── Determine the text to pass to the bot ─────────────────────────────────

  let userText: string | null = null;

  // 1. Postback (button template tap, persistent menu tap, Get Started tap)
  if (event.postback?.payload) {
    userText = event.postback.payload;
  }

  // 2. Quick reply (chip tap — also has message.text set to the title)
  else if (event.message?.quick_reply?.payload) {
    userText = event.message.quick_reply.payload;
  }

  // 3. Plain text message
  else if (event.message?.text) {
    userText = event.message.text;
  }

  // 4. User sent an attachment (image, audio, etc.) — acknowledge but no text
  else if (event.message?.attachments) {
    userText = "[attachment]";
  }

  if (!userText) return;

  await resumeMessengerFlow({
    psid,
    pageAccessToken,
    credentialsId: params.credentialsId,
    workspaceId: params.workspaceId,
    userMessage: userText,
  });
}

// ── Feed / Comment event handler ──────────────────────────────────────────────

async function handleFeedEvent(
  value: any,
  pageAccessToken: string,
  params: { workspaceId: string; credentialsId: string }
) {
  // Only handle new comments (not post edits, likes, etc.)
  if (value.item !== "comment" || value.verb !== "add") return;
  // Ignore comments by the page itself
  if (value.from?.id === value.sender_id) return;

  const commentText: string = value.message ?? "";
  const commenterPsid: string | undefined = value.sender?.id ?? value.from?.id;

  if (!commenterPsid || !commentText) return;

  // ── Keyword matching ──────────────────────────────────────────────────────
  // Configure your keyword triggers here or load from DB
  const COMMENT_KEYWORDS = ["guide", "info", "price", "buy", "order"];
  const normalized = commentText.toLowerCase().trim();
  const matched = COMMENT_KEYWORDS.some((kw) => normalized.includes(kw));

  if (!matched) return;

  // ── Public comment reply (randomized to avoid spam detection) ────────────
  const COMMENT_REPLIES = [
    "Thanks for commenting! Check your DMs 📬",
    "Great question! I've sent you a message 👆",
    "Hi! I've sent you the details in Messenger 😊",
  ];
  const randomReply =
    COMMENT_REPLIES[Math.floor(Math.random() * COMMENT_REPLIES.length)];

  // Reply to the comment publicly
  await fetch(
    `https://graph.facebook.com/v19.0/${value.comment_id}/comments?access_token=${pageAccessToken}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: randomReply }),
    }
  ).catch(console.error);

  // ── Send DM to commenter ─────────────────────────────────────────────────
  // Start (or resume) the Messenger flow for this commenter
  await resumeMessengerFlow({
    psid: commenterPsid,
    pageAccessToken,
    credentialsId: params.credentialsId,
    workspaceId: params.workspaceId,
    userMessage: commentText,
  });
}
