import { createAction, option } from "@typebot.io/forge";
import { auth } from "../auth";

const listItemSchema = option.object({
  title: option.string.meta({ layout: { label: "Title", isRequired: true } }),
  subtitle: option.string.meta({ layout: { label: "Subtitle" } }),
  imageUrl: option.string.meta({ layout: { label: "Image URL" } }),
  buttonType: option.enum(["web_url", "postback"] as const).meta({
    layout: { label: "Button Type (optional)" },
  }),
  buttonTitle: option.string.meta({ layout: { label: "Button Title" } }),
  buttonUrl: option.string.meta({ layout: { label: "Button URL (for web_url)" } }),
  buttonPayload: option.string.meta({ layout: { label: "Button Payload (for postback)" } }),
});

export const sendListTemplate = createAction({
  auth,
  name: "Send List Template",
  options: option.object({
    recipientId: option.string.meta({
      layout: { label: "Recipient PSID", isRequired: true },
    }),
    items: option.array(listItemSchema).meta({
      layout: { label: "List Items (2–4)", itemLabel: "item" },
    }),
    globalButtonTitle: option.string.meta({
      layout: { label: "Global Bottom Button Title (optional)" },
    }),
    globalButtonUrl: option.string.meta({
      layout: { label: "Global Bottom Button URL (optional)" },
    }),
    responseMapping: option.saveResponseArray(["Response"]).meta({
      layout: { accordion: "Save response" },
    }),
  }),
});
