import { createAction, option } from "@typebot.io/forge";
import { auth } from "../auth";

export const sendAttachment = createAction({
  auth,
  name: "Send Attachment",
  options: option.object({
    recipientId: option.string.meta({
      layout: { label: "Recipient PSID", isRequired: true },
    }),
    attachmentType: option.enum(["image", "video", "audio", "file"] as const).meta({
      layout: { label: "Attachment Type", isRequired: true },
    }),
    url: option.string.meta({
      layout: { label: "File URL", isRequired: true },
    }),
    responseMapping: option.saveResponseArray(["Response"]).meta({
      layout: { accordion: "Save response" },
    }),
  }),
});
