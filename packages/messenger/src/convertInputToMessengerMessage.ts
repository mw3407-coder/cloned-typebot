import { InputBlockType } from "@typebot.io/blocks-inputs/constants";
import type { ContinueChatResponse } from "@typebot.io/chat-api/schemas";

type QuickReply = {
  content_type: "text";
  title: string;
  payload: string;
};

type QuickReplyMessage = {
  text: string;
  quick_replies: QuickReply[];
};

export const convertInputToMessengerMessage = (
  input: NonNullable<ContinueChatResponse["input"]>,
  lastMessageText?: string,
): QuickReplyMessage | null => {
  if (input.type !== InputBlockType.CHOICE) return null;
  if (input.options?.isMultipleChoice) return null;

  const items = input.items.filter((item) => item.content);
  if (items.length === 0) return null;

  const quickReplies: QuickReply[] = items.slice(0, 13).map((item) => ({
    content_type: "text" as const,
    title: (item.content as string).slice(0, 20),
    payload: item.content as string,
  }));

  return {
    text: lastMessageText ?? "Choose an option:",
    quick_replies: quickReplies,
  };
};
