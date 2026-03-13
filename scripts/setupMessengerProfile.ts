// ─────────────────────────────────────────────────────────────────────────────
// scripts/setupMessengerProfile.ts
//
// One-time setup for your Facebook Page's Messenger profile.
// Run this ONCE (or whenever you want to change the menu/greeting):
//
//   PAGE_ACCESS_TOKEN=xxx npx tsx scripts/setupMessengerProfile.ts
//
// ─────────────────────────────────────────────────────────────────────────────

import {
  setMessengerPersistentMenu,
  setGetStartedButton,
  setGreetingText,
} from "../packages/messenger/src/messengerProfile";

const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;
if (!PAGE_ACCESS_TOKEN) {
  console.error("Missing PAGE_ACCESS_TOKEN env var");
  process.exit(1);
}

async function setup() {
  console.log("Setting up Messenger profile for Orbit 265...");

  // ── 1. Greeting (shown before first message) ─────────────────────────────
  await setGreetingText(
    "Hi {{user_first_name}}! 👋 Welcome to Orbit 265 — your Malawi phone shop. Tap Get Started to browse our latest phones.",
    PAGE_ACCESS_TOKEN
  );
  console.log("✅ Greeting set");

  // ── 2. Get Started button ─────────────────────────────────────────────────
  // This payload will arrive as event.postback.payload in your webhook
  await setGetStartedButton("GET_STARTED", PAGE_ACCESS_TOKEN);
  console.log("✅ Get Started button set");

  // ── 3. Persistent Menu ────────────────────────────────────────────────────
  // Max 3 items. Postback payloads handled in route.ts
  await setMessengerPersistentMenu(
    [
      { type: "postback", title: "🏠 Main Menu",     payload: "MENU_HOME"     },
      { type: "postback", title: "📱 Browse Phones", payload: "MENU_PHONES"   },
      { type: "postback", title: "📞 Contact Us",    payload: "MENU_CONTACT"  },
    ],
    PAGE_ACCESS_TOKEN
  );
  console.log("✅ Persistent menu set");

  console.log("\n🎉 Messenger profile setup complete!");
  console.log("The menu and greeting will appear in Messenger within a few minutes.");
  console.log("\nPostback payloads to handle in route.ts:");
  console.log("  GET_STARTED   → start welcome flow");
  console.log("  MENU_HOME     → start main menu flow");
  console.log("  MENU_PHONES   → start product browse flow");
  console.log("  MENU_CONTACT  → start contact flow");
}

setup().catch((err) => {
  console.error("Setup failed:", err);
  process.exit(1);
});
