// ─────────────────────────────────────────────────────────────────────────────
// packages/messenger/src/sendMessengerMessage.ts
// ─────────────────────────────────────────────────────────────────────────────

import type { MessengerMessage } from "./messengerTypes";

const FB_API_VERSION = "v19.0";
const FB_MESSAGES_URL = `https://graph.facebook.com/${FB_API_VERSION}/me/messages`;

type SendMessageParams = {
  to: string;              // PSID (Page-Scoped User ID)
  message: MessengerMessage;
  pageAccessToken: string;
};

export async function sendMessengerMessage({
  to,
  message,
  pageAccessToken,
}: SendMessageParams): Promise<void> {
  const body = {
    recipient: { id: to },
    message,
    messaging_type: "RESPONSE",
    access_token: pageAccessToken,
  };

  const res = await fetch(FB_MESSAGES_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    console.error("[Messenger] Send failed:", JSON.stringify(err));
    throw new Error(
      `Facebook Send API error ${res.status}: ${JSON.stringify(err)}`
    );
  }
}
