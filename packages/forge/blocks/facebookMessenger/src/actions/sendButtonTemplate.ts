import { createAction, option } from "@typebot.io/forge";
import { auth } from "../auth";

const buttonSchema = option.object({
  type: option.enum(["web_url", "postback", "phone_number"] as const).meta({
    layout: { label: "Button Type", isRequired: true },
  }),
  title: option.string.meta({ layout: { label: "Button Title", isRequired: true } }),
  url: option.string.meta({ layout: { label: "URL (for web_url)" } }),
  webviewHeightRatio: option.enum(["compact", "tall", "full"] as const).meta({
    layout: { label: "Webview Height (for web_url)" },
  }),
  payload: option.string.meta({ layout: { label: "Payload (for postback)" } }),
  phoneNumber: option.string.meta({ layout: { label: "Phone Number (for phone_number)" } }),
});

export const sendButtonTemplate = createAction({
  auth,
  name: "Send Button Template",
  options: option.object({
    recipientId: option.string.meta({
      layout: { label: "Recipient PSID", isRequired: true },
    }),
    bodyText: option.string.meta({
      layout: {
        label: "Body Text",
        isRequired: true,
        inputType: "textarea",
        helperText: "UTF-8 encoded text of up to 640 characters.",
      },
    }),
    buttons: option.array(buttonSchema).meta({
      layout: { label: "Buttons (up to 3)", itemLabel: "button" },
    }),
    responseMapping: option.saveResponseArray(["Response"]).meta({
      layout: { accordion: "Save response" },
    }),
  }),
});
