import { createAction, option } from "@typebot.io/forge";
import { auth } from "../auth";

const menuItemSchema = option.object({
  type: option.enum(["postback", "web_url"] as const).meta({
    layout: { label: "Item Type", isRequired: true },
  }),
  title: option.string.meta({ layout: { label: "Title", isRequired: true } }),
  payload: option.string.meta({ layout: { label: "Payload (for postback)" } }),
  url: option.string.meta({ layout: { label: "URL (for web_url)" } }),
});

export const setPersistentMenu = createAction({
  auth,
  name: "Set Persistent Menu",
  options: option.object({
    menuItems: option.array(menuItemSchema).meta({
      layout: {
        label: "Menu Items (up to 3)",
        itemLabel: "menu item",
        helperText: "These appear in the hamburger menu at the bottom of Messenger conversations.",
      },
    }),
    responseMapping: option.saveResponseArray(["Response"]).meta({
      layout: { accordion: "Save response" },
    }),
  }),
});
