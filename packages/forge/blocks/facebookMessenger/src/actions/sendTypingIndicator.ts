import { createAction, option } from "@typebot.io/forge";
import { auth } from "../auth";

export const sendTypingIndicator = createAction({
  auth,
  name: "Send Typing Indicator",
  options: option.object({
    recipientId: option.string.meta({
      layout: { label: "Recipient PSID", isRequired: true },
    }),
    senderAction: option.enum(["typing_on", "typing_off", "mark_seen"] as const).meta({
      layout: { label: "Action", isRequired: true },
    }),
  }),
});
