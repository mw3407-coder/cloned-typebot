import { z } from "zod";
import { WEBHOOK_SUCCESS_MESSAGE } from "../constants";
import { resumeMessengerFlow } from "../resumeMessengerFlow";
import { messengerWebhookRequestBodySchema } from "../schemas";

export const messengerIncomingMessageInputSchema =
  messengerWebhookRequestBodySchema.extend({
    workspaceId: z.string(),
    credentialsId: z.string(),
  });

export const handleMessengerIncomingMessage = ({
  input: { entry, workspaceId, credentialsId },
}: {
  input: z.infer<typeof messengerIncomingMessageInputSchema>;
}) => {
  console.log("[Messenger] handleMessengerIncomingMessage called", {
    workspaceId,
    credentialsId,
    entryCount: entry.length,
  });

  // Fire-and-forget: process the flow asynchronously so we return
  // WEBHOOK_SUCCESS_MESSAGE to Facebook immediately and prevent retries.
  (async () => {
    for (const e of entry) {
      for (const messaging of e.messaging) {
        const psid = messaging.sender.id;
        const text = messaging.message?.text ?? messaging.postback?.payload;
        console.log("[Messenger] Processing message", { psid, text });
        try {
          const result = await resumeMessengerFlow({
            psid,
            text,
            workspaceId,
            credentialsId,
          });
          console.log("[Messenger] resumeMessengerFlow result", result);
        } catch (err) {
          console.error("[Messenger] Error in resumeMessengerFlow", err);
        }
      }
    }
  })();

  return WEBHOOK_SUCCESS_MESSAGE;
};
