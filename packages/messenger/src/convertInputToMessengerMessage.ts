// ─────────────────────────────────────────────────────────────────────────────
// packages/messenger/src/convertInputToMessengerMessage.ts
// ─────────────────────────────────────────────────────────────────────────────

import { InputBlockType } from "@typebot.io/blocks-inputs/constants";
import type { InputBlock } from "@typebot.io/blocks-inputs/schema";
import type { MessengerMessage, QuickReply } from "./messengerTypes";

/**
 * Converts a Typebot InputBlock into the correct Facebook Messenger message.
 *
 * Mapping:
 *  CHOICE  ≤ 13 options → Quick Replies     (dismissible chip row)
 *  CHOICE  > 13 options → Numbered text list
 *  EMAIL                → text + user_email  bubble
 *  PHONE                → text + user_phone_number bubble
 *  NUMBER / TEXT / URL  → plain text prompt (user types freely)
 *  All others           → null (Typebot handles natively; no extra FB message)
 *
 * @param input          The Typebot input block
 * @param promptText     The last text bubble shown before this input (used as
 *                       the quick-reply prompt)
 * @returns              A MessengerMessage ready to POST, or null to skip
 *
 * VERIFIED (Task 6): Correctly implements quick_replies for single choice <= 13 items.
 */
export function convertInputToMessengerMessage(
  input: InputBlock,
  promptText: string | undefined,
): MessengerMessage | null {
  const prompt = (promptText ?? "Choose an option:").slice(0, 640);

  // ── Choice / Multiple Choice ──────────────────────────────────────────────
  if (input.type === InputBlockType.CHOICE) {
    const choiceInput = input as any;
    const items: any[] = choiceInput.items ?? [];
    const isMultipleChoice = choiceInput.options?.isMultipleChoice ?? false;

    if (items.length === 0) return null;

    // Fallback to numbered list if multiple choice or > 13 items
    if (isMultipleChoice || items.length > 13) {
      const listText = items
        .map((item, index) => `${index + 1}. ${item.content ?? ""}`)
        .join("\n");
      return {
        text: `${prompt}\n\n${listText}`.slice(0, 2000),
      };
    }

    // Standard Quick Replies for single choice (1-13 items)
    const quickReplies: QuickReply[] = items
      .map((item) => {
        const title = String(item.content ?? "").trim();
        const payload = String(item.value ?? item.content ?? "").trim();

        if (!title) return null;

        return {
          content_type: "text" as const,
          title: title.slice(0, 20),
          payload,
        };
      })
      .filter((qr): qr is NonNullable<typeof qr> => qr !== null);

    if (quickReplies.length === 0) return null;

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
