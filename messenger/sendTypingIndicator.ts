// ─────────────────────────────────────────────────────────────────────────────
// packages/messenger/src/sendTypingIndicator.ts
// ─────────────────────────────────────────────────────────────────────────────

const FB_API_VERSION = "v19.0";
const FB_MESSAGES_URL = `https://graph.facebook.com/${FB_API_VERSION}/me/messages`;

/**
 * Shows the "..." typing bubble in Messenger, then waits a human-like delay.
 * Call this before every sendMessengerMessage to make the bot feel natural.
 *
 * @param to             PSID of the recipient
 * @param pageAccessToken
 * @param textLength     Character count of the upcoming message (used to scale delay)
 */
export async function sendTypingIndicator(
  to: string,
  pageAccessToken: string,
  textLength = 100
): Promise<void> {
  // Show typing bubble
  await fetch(FB_MESSAGES_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      recipient: { id: to },
      sender_action: "typing_on",
      access_token: pageAccessToken,
    }),
  });

  // Human-like delay: ~30ms per char, min 500ms, max 3000ms
  const delay = Math.min(Math.max(textLength * 30, 500), 3000);
  await new Promise((r) => setTimeout(r, delay));
}

/**
 * Explicitly turns off the typing indicator (optional — it auto-clears after ~20s).
 */
export async function clearTypingIndicator(
  to: string,
  pageAccessToken: string
): Promise<void> {
  await fetch(FB_MESSAGES_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      recipient: { id: to },
      sender_action: "typing_off",
      access_token: pageAccessToken,
    }),
  });
}
