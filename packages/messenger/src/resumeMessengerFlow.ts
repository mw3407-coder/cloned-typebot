// ─────────────────────────────────────────────────────────────────────────────
// packages/messenger/src/resumeMessengerFlow.ts
//
// Drop-in replacement for your current resumeMessengerFlow.ts.
// Changes from previous version:
//   - Typing indicator before every message
//   - Button template (≤3) vs quick replies (4+) for Choice blocks
//   - Email/phone native bubbles
//   - Carousel block detection (messengerCarousel)
//   - List block detection (messengerList)
//   - Media/attachment block detection
// ─────────────────────────────────────────────────────────────────────────────

import { BotMessage } from "@typebot.io/bot-engine/schemas/api";
import { continueBotFlow } from "@typebot.io/bot-engine/continueBotFlow";
import { startSession } from "@typebot.io/bot-engine/startSession";
import prisma from "@typebot.io/prisma";
import { convertInputToMessengerMessage } from "./convertInputToMessengerMessage";
import { sendMessengerMessage } from "./sendMessengerMessage";
import { sendTypingIndicator } from "./sendTypingIndicator";
import {
  buildCarousel,
  buildList,
  buildMediaTemplate,
  buildAttachment,
} from "./templateBuilders";
import type { MessengerMessage } from "./messengerTypes";

// ── helpers ───────────────────────────────────────────────────────────────────

function extractText(message: BotMessage): string {
  if (message.type === "text") {
    return message.content?.richText
      ?.map((block: any) =>
        block.children
          ?.map((c: any) => c.text ?? "")
          .join("") ?? ""
      )
      .join("\n")
      .trim() ?? "";
  }
  return "";
}

/**
 * Send a single Typebot BotMessage to Messenger.
 * Handles text, images, videos, audio, files, and custom template blocks.
 * Returns the text content (for use as the next block's prompt).
 */
async function sendBotMessage(
  message: BotMessage,
  psid: string,
  pageAccessToken: string
): Promise<string> {
  const type = message.type;

  // ── Plain text ──────────────────────────────────────────────────────────
  if (type === "text") {
    const text = extractText(message);
    if (!text) return "";
    await sendTypingIndicator(psid, pageAccessToken, text.length);
    await sendMessengerMessage({ to: psid, message: { text }, pageAccessToken });
    return text;
  }

  // ── Image bubble ────────────────────────────────────────────────────────
  if (type === "image") {
    const url = (message as any).content?.url as string | undefined;
    if (!url) return "";
    await sendTypingIndicator(psid, pageAccessToken, 50);
    await sendMessengerMessage({
      to: psid,
      message: buildAttachment("image", url),
      pageAccessToken,
    });
    return "";
  }

  // ── Video bubble ────────────────────────────────────────────────────────
  if (type === "video") {
    const url = (message as any).content?.url as string | undefined;
    if (!url) return "";
    await sendTypingIndicator(psid, pageAccessToken, 50);
    await sendMessengerMessage({
      to: psid,
      message: buildAttachment("video", url),
      pageAccessToken,
    });
    return "";
  }

  // ── Audio bubble ────────────────────────────────────────────────────────
  if (type === "audio") {
    const url = (message as any).content?.url as string | undefined;
    if (!url) return "";
    await sendTypingIndicator(psid, pageAccessToken, 50);
    await sendMessengerMessage({
      to: psid,
      message: buildAttachment("audio", url),
      pageAccessToken,
    });
    return "";
  }

  // ── Carousel block (custom: messengerCarousel) ──────────────────────────
  // Your new block type — array of cards with image, title, subtitle, buttons
  if (type === "messengerCarousel") {
    const elements = (message as any).content?.elements ?? [];
    if (elements.length === 0) return "";
    await sendTypingIndicator(psid, pageAccessToken, 80);
    await sendMessengerMessage({
      to: psid,
      message: buildCarousel(elements),
      pageAccessToken,
    });
    return "";
  }

  // ── List block (custom: messengerList) ──────────────────────────────────
  if (type === "messengerList") {
    const elements = (message as any).content?.elements ?? [];
    const globalButton = (message as any).content?.globalButton;
    if (elements.length === 0) return "";
    await sendTypingIndicator(psid, pageAccessToken, 60);
    await sendMessengerMessage({
      to: psid,
      message: buildList(elements, globalButton ? [globalButton] : undefined),
      pageAccessToken,
    });
    return "";
  }

  // ── Media template block (custom: messengerMedia) ───────────────────────
  if (type === "messengerMedia") {
    const { mediaType, url, attachmentId, buttons } = (message as any).content ?? {};
    if (!mediaType || (!url && !attachmentId)) return "";
    await sendTypingIndicator(psid, pageAccessToken, 50);
    const source = attachmentId ? { attachment_id: attachmentId } : { url };
    await sendMessengerMessage({
      to: psid,
      message: buildMediaTemplate(mediaType, source, buttons),
      pageAccessToken,
    });
    return "";
  }

  return "";
}

// ── Main export ───────────────────────────────────────────────────────────────

export async function resumeMessengerFlow({
  psid,
  pageAccessToken,
  credentialsId,
  workspaceId,
  userMessage,
}: {
  psid: string;
  pageAccessToken: string;
  credentialsId: string;
  workspaceId: string;
  userMessage: string;
}): Promise<void> {
  const sessionId = `fbm-${credentialsId}-${psid}`;

  // ── Existing session ───────────────────────────────────────────────────────
  const existingSession = await prisma.chatSession.findUnique({
    where: { id: sessionId },
  });

  if (existingSession) {
    const { messages, input } = await continueBotFlow(
      userMessage,
      { version: 2, state: existingSession.state as any }
    );

    let lastMessageText = "";
    for (const message of messages) {
      lastMessageText = await sendBotMessage(message, psid, pageAccessToken);
    }

    if (input) {
      const inputMessage = convertInputToMessengerMessage(input, lastMessageText);
      if (inputMessage) {
        await sendTypingIndicator(psid, pageAccessToken, 40);
        await sendMessengerMessage({
          to: psid,
          message: inputMessage,
          pageAccessToken,
        });
      }
    } else {
      // Flow finished — clean up session
      await prisma.chatSession.delete({ where: { id: sessionId } }).catch(() => {});
    }

    return;
  }

  // ── New session ────────────────────────────────────────────────────────────
  const credentials = await prisma.credentials.findFirst({
    where: { id: credentialsId, workspaceId },
  });

  if (!credentials) {
    console.error("[Messenger] Credentials not found:", credentialsId);
    return;
  }

  // Find the typebot linked to this Messenger integration
  // (Adjust this query to match your schema if needed)
  const typebotId = (credentials.data as any)?.typebotId;
  if (!typebotId) {
    console.error("[Messenger] No typebotId on credentials:", credentialsId);
    return;
  }

  const { messages, input, clientSideActions, newSessionState } =
    await startSession({
      startParams: {
        type: "live-chat",
        isStreamEnabled: false,
        typebotId,
        message: userMessage,
      },
    });

  // Save session
  await prisma.chatSession.upsert({
    where: { id: sessionId },
    create: { id: sessionId, state: newSessionState as any },
    update: { state: newSessionState as any },
  });

  let lastMessageText = "";
  for (const message of messages) {
    lastMessageText = await sendBotMessage(message, psid, pageAccessToken);
  }

  if (input) {
    const inputMessage = convertInputToMessengerMessage(input, lastMessageText);
    if (inputMessage) {
      await sendTypingIndicator(psid, pageAccessToken, 40);
      await sendMessengerMessage({
        to: psid,
        message: inputMessage,
        pageAccessToken,
      });
    }
  }
}
