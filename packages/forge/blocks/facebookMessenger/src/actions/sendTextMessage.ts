import { createAction, option } from "@typebot.io/forge";
import { auth } from "../auth";

export const sendTextMessage = createAction({
  auth,
  name: "Send Text Message",
  options: option.object({
    recipientId: option.string.meta({
      layout: {
        label: "Recipient PSID",
        isRequired: true,
        helperText:
          "The recipient's Page-Scoped ID. Use a variable captured from the Messenger webhook.",
      },
    }),
    message: option.string.meta({
      layout: {
        label: "Message Text",
        isRequired: true,
        inputType: "textarea",
      },
    }),
    messageTag: option.enum([
      "CONFIRMED_EVENT_UPDATE",
      "POST_PURCHASE_UPDATE",
      "ACCOUNT_UPDATE",
      "HUMAN_AGENT",
    ] as const).meta({
      layout: {
        label: "Message Tag (optional)",
        helperText:
          "Required to send messages outside the 24-hour window. Leave blank for standard messages.",
      },
    }),
    responseMapping: option.saveResponseArray(["Response"]).meta({
      layout: { accordion: "Save response" },
    }),
  }),
});
