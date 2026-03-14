// ─────────────────────────────────────────────────────────────────────────────
// packages/messenger/src/convertInputToMessengerMessage.ts
// ─────────────────────────────────────────────────────────────────────────────

import { InputBlockType } from "@typebot.io/blocks-inputs/constants";
import type { InputBlock } from "@typebot.io/blocks-inputs/schema";
import type {
  MessengerMessage,
  Button,
  QuickReply,
} from "./messengerTypes";

/**
 * Converts a Typebot InputBlock into the correct Facebook Messenger message.
 *
 * Mapping:
 *  CHOICE  ≤ 3 options  → Button Template  (large inline buttons)
 *  CHOICE  4–13 options → Quick Replies     (dismissible chip row)
 *  EMAIL                → text + user_email  bubble
 *  PHONE                → text + user_phone_number bubble
 *  NUMBER / TEXT / URL  → plain text prompt (user types freely)
 *  All others           → null (Typebot handles natively; no extra FB message)
 *
 * @param input          The Typebot input block
 * @param promptText     The last text bubble shown before this input (used as
 *                       the button-template prompt or quick-reply prompt)
 * @returns              A MessengerMessage ready to POST, or null to skip
 */
export function convertInputToMessengerMessage(
  input: InputBlock,
  promptText: string | undefined
): MessengerMessage | null {
  const prompt = (promptText ?? "Choose an option:").slice(0, 640);

  // ── Choice / Multiple Choice ──────────────────────────────────────────────
  if (input.type === InputBlockType.CHOICE) {
    const items: Array<{ content?: string }> =
      (input as any)?.items ?? (input.options as any)?.items ?? [];

    if (items.length === 0) return null;

    // Extract labels, truncate to Facebook's 20-char limit
    const labels = items
      .map((item) => String(item.content ?? "").trim())
      .filter(Boolean)
      .slice(0, 13);

    if (labels.length === 0) return null;

    // ≤ 3 items → Button Template (renders as large persistent buttons)
    if (labels.length <= 3) {
      const buttons: Button[] = labels.map((label) => ({
        type: "postback" as const,
        title: label.slice(0, 20),
        payload: label,
      }));

      return {
        attachment: {
          type: "template",
          payload: {
            template_type: "button",
            text: prompt,
            buttons,
          },
        },
      };
    }

    // 4–13 items → Quick Replies (chip row below input)
    const quickReplies: QuickReply[] = labels.map((label) => ({
      content_type: "text" as const,
      title: label.slice(0, 20),
      payload: label,
    }));

    return {
      text: prompt,
      quick_replies: quickReplies,
    };
  }

  // ── Email Input ───────────────────────────────────────────────────────────
  // Shows the user's Facebook-registered email as a tappable pre-fill bubble.
  // They can tap it or type a different address.
  if (input.type === InputBlockType.EMAIL) {
    return {
      text: prompt,
      quick_replies: [{ content_type: "user_email" }],
    };
  }

  // ── Phone Input ───────────────────────────────────────────────────────────
  // Shows the user's Facebook-registered phone as a tappable pre-fill bubble.
  if (input.type === InputBlockType.PHONE) {
    return {
      text: prompt,
      quick_replies: [{ content_type: "user_phone_number" }],
    };
  }

  // ── All other input types (text, number, URL, date, etc.) ─────────────────
  // Typebot already sent the prompt text as a text bubble in resumeMessengerFlow.
  // No additional FB message needed — the user just types their reply.
  return null;
}
