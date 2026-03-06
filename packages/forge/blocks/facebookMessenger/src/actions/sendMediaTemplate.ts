import { createAction, option } from "@typebot.io/forge";
import { auth } from "../auth";

const buttonSchema = option.object({
  type: option.enum(["web_url", "postback"] as const).meta({
    layout: { label: "Button Type", isRequired: true },
  }),
  title: option.string.meta({ layout: { label: "Button Title", isRequired: true } }),
  url: option.string.meta({ layout: { label: "URL (for web_url)" } }),
  payload: option.string.meta({ layout: { label: "Payload (for postback)" } }),
});

export const sendMediaTemplate = createAction({
  auth,
  name: "Send Media Template",
  options: option.object({
    recipientId: option.string.meta({
      layout: { label: "Recipient PSID", isRequired: true },
    }),
    mediaType: option.enum(["image", "video"] as const).meta({
      layout: { label: "Media Type", isRequired: true },
    }),
    url: option.string.meta({
      layout: {
        label: "Media URL",
        helperText: "Must be a Facebook-hosted URL (fb.com or fbcdn.net).",
      },
    }),
    attachmentId: option.string.meta({
      layout: { label: "Attachment ID (alternative to URL)" },
    }),
    buttons: option.array(buttonSchema).meta({
      layout: { label: "Buttons (up to 2)", itemLabel: "button" },
    }),
    responseMapping: option.saveResponseArray(["Response"]).meta({
      layout: { accordion: "Save response" },
    }),
  }),
});
