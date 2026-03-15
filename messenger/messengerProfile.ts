// ─────────────────────────────────────────────────────────────────────────────
// packages/messenger/src/messengerProfile.ts
//
// One-time setup calls to the Messenger Profile API.
// These configure persistent UI elements (menu, get-started button, greeting).
// Call these ONCE when setting up a new Facebook Page — not per message.
// ─────────────────────────────────────────────────────────────────────────────

import type { Button } from "./messengerTypes";

const FB_API_VERSION = "v19.0";
const PROFILE_URL = `https://graph.facebook.com/${FB_API_VERSION}/me/messenger_profile`;

// ── Persistent Menu ───────────────────────────────────────────────────────────

type MenuCallToAction = {
  type: "postback" | "web_url";
  title: string;
  payload?: string;   // for postback
  url?: string;       // for web_url
};

/**
 * Sets the persistent hamburger menu (☰) that always shows in Messenger.
 * Up to 3 top-level items. Each item is a postback or URL button.
 *
 * Example:
 *   await setMessengerPersistentMenu([
 *     { type: "postback", title: "🏠 Main Menu",    payload: "MENU_HOME"     },
 *     { type: "postback", title: "📱 Browse Phones", payload: "MENU_PHONES"  },
 *     { type: "web_url",  title: "🌐 Our Website",   url: "https://orbit265.me" },
 *   ], "YOUR_PAGE_ACCESS_TOKEN");
 *
 * Note: Call this once from an admin endpoint or setup script.
 * Changes take effect within a few minutes for users.
 */
export async function setMessengerPersistentMenu(
  items: MenuCallToAction[],
  pageAccessToken: string
): Promise<void> {
  const res = await fetch(`${PROFILE_URL}?access_token=${pageAccessToken}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      persistent_menu: [
        {
          locale: "default",
          composer_input_disabled: false,
          call_to_actions: items.slice(0, 3),
        },
      ],
    }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(`Persistent menu error: ${JSON.stringify(data)}`);
  console.log("[Messenger] Persistent menu set:", data);
}

// ── Get Started Button ────────────────────────────────────────────────────────

/**
 * Sets the "Get Started" button shown to new users before any conversation.
 * When tapped, sends a postback with the given payload to your webhook.
 *
 * Example:
 *   await setGetStartedButton("GET_STARTED", "YOUR_TOKEN");
 *   // Then handle event.postback.payload === "GET_STARTED" in route.ts
 */
export async function setGetStartedButton(
  payload: string,
  pageAccessToken: string
): Promise<void> {
  const res = await fetch(`${PROFILE_URL}?access_token=${pageAccessToken}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      get_started: { payload },
    }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(`Get started button error: ${JSON.stringify(data)}`);
  console.log("[Messenger] Get Started button set:", data);
}

// ── Greeting Text ─────────────────────────────────────────────────────────────

/**
 * Sets the greeting shown to new users before they start a conversation.
 * Supports {{user_first_name}}, {{user_last_name}}, {{user_full_name}} variables.
 *
 * Example:
 *   await setGreetingText(
 *     "Hi {{user_first_name}}! 👋 Welcome to Orbit 265. Tap Get Started to browse our phones.",
 *     "YOUR_TOKEN"
 *   );
 */
export async function setGreetingText(
  text: string,
  pageAccessToken: string
): Promise<void> {
  const res = await fetch(`${PROFILE_URL}?access_token=${pageAccessToken}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      greeting: [
        { locale: "default", text: text.slice(0, 160) },
      ],
    }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(`Greeting text error: ${JSON.stringify(data)}`);
  console.log("[Messenger] Greeting text set:", data);
}

// ── Delete Profile Fields ─────────────────────────────────────────────────────

/**
 * Removes profile fields (use to reset menu or greeting).
 *
 * Example:
 *   await deleteMessengerProfileFields(["persistent_menu", "get_started"], token);
 */
export async function deleteMessengerProfileFields(
  fields: Array<"persistent_menu" | "get_started" | "greeting">,
  pageAccessToken: string
): Promise<void> {
  const res = await fetch(`${PROFILE_URL}?access_token=${pageAccessToken}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fields }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(`Delete profile error: ${JSON.stringify(data)}`);
  console.log("[Messenger] Profile fields deleted:", data);
}
