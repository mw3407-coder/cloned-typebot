import { after } from "next/server";
import { z } from "zod";
import { WEBHOOK_SUCCESS_MESSAGE } from "../constants";
import { messengerWebhookRequestBodySchema } from "../schemas";
import { resumeMessengerFlow } from "../resumeMessengerFlow";

export const messengerIncomingMessageInputSchema =
  messengerWebhookRequestBodySchema.extend({
    workspaceId: z.string(),
    credentialsId: z.string(),
  });

export const handleMessengerIncomingMessage = async ({
  input: { entry, workspaceId, credentialsId },
}: {
  input: z.infer<typeof messengerIncomingMessageInputSchema>;
}) => {
  after(async () => {
    for (const e of entry) {
      for (const messaging of e.messaging) {
        const psid = messaging.sender.id;
        const text = messaging.message?.text ?? messaging.postback?.payload;
        try {
          await resumeMessengerFlow({
            psid,
            text,
            workspaceId,
            credentialsId,
          });
        } catch (err) {
          console.error("Error processing Messenger message", err);
        }
      }
    }
  });

  return WEBHOOK_SUCCESS_MESSAGE;
};
