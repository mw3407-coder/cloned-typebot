import { createAction, option } from "@typebot.io/forge";
import { auth } from "../auth";

const quickReplySchema = option.object({
  contentType: option.enum(["text", "user_email", "user_phone_number"] as const).meta({
    layout: { label: "Content Type", isRequired: true },
  }),
  title: option.string.meta({ layout: { label: "Title (for text type, max 20 chars)" } }),
  payload: option.string.meta({ layout: { label: "Payload (for text type)" } }),
  imageUrl: option.string.meta({ layout: { label: "Image URL (for text type, optional)" } }),
});

export const sendQuickReplies = createAction({
  auth,
  name: "Send Quick Replies",
  options: option.object({
    recipientId: option.string.meta({
      layout: { label: "Recipient PSID", isRequired: true },
    }),
    messageText: option.string.meta({
      layout: { label: "Message Text", isRequired: true, inputType: "textarea" },
    }),
    quickReplies: option.array(quickReplySchema).meta({
      layout: { label: "Quick Replies (up to 11)", itemLabel: "quick reply" },
    }),
    responseMapping: option.saveResponseArray(["Response"]).meta({
      layout: { accordion: "Save response" },
    }),
  }),
});
