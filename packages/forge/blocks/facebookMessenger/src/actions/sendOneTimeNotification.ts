import { createAction, option } from "@typebot.io/forge";
import { auth } from "../auth";

export const sendOneTimeNotification = createAction({
  auth,
  name: "Send One-Time Notification Request",
  options: option.object({
    recipientId: option.string.meta({
      layout: { label: "Recipient PSID", isRequired: true },
    }),
    title: option.string.meta({
      layout: {
        label: "Notification Topic",
        isRequired: true,
        helperText: "Displayed to the user as the notification subject they are opting into.",
      },
    }),
    payload: option.string.meta({
      layout: {
        label: "Payload",
        isRequired: true,
        helperText: "Returned to your webhook when the user opts in.",
      },
    }),
    responseMapping: option.saveResponseArray(["Response"]).meta({
      layout: { accordion: "Save response" },
    }),
  }),
});
