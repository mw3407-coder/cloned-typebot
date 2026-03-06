import { createAction, option } from "@typebot.io/forge";
import { auth } from "../auth";

const buttonSchema = option.object({
  type: option.enum(["web_url", "postback", "phone_number", "share"] as const).meta({
    layout: { label: "Button Type", isRequired: true },
  }),
  title: option.string.meta({ layout: { label: "Button Title" } }),
  url: option.string.meta({ layout: { label: "URL (for web_url)" } }),
  webviewHeightRatio: option.enum(["compact", "tall", "full"] as const).meta({
    layout: { label: "Webview Height (for web_url)" },
  }),
  payload: option.string.meta({ layout: { label: "Payload (for postback)" } }),
  phoneNumber: option.string.meta({ layout: { label: "Phone Number (for phone_number)" } }),
});

const cardSchema = option.object({
  title: option.string.meta({ layout: { label: "Card Title", isRequired: true } }),
  subtitle: option.string.meta({ layout: { label: "Card Subtitle" } }),
  imageUrl: option.string.meta({ layout: { label: "Image URL" } }),
  buttons: option.array(buttonSchema).meta({
    layout: { label: "Buttons (up to 3)", itemLabel: "button" },
  }),
});

export const sendGenericTemplate = createAction({
  auth,
  name: "Send Generic Template (Carousel)",
  options: option.object({
    recipientId: option.string.meta({
      layout: { label: "Recipient PSID", isRequired: true },
    }),
    cards: option.array(cardSchema).meta({
      layout: { label: "Cards (up to 10)", itemLabel: "card" },
    }),
    responseMapping: option.saveResponseArray(["Response"]).meta({
      layout: { accordion: "Save response" },
    }),
  }),
});
