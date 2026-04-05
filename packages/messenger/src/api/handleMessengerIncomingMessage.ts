import { z } from "zod";
import { LOG_PREFIX, WEBHOOK_SUCCESS_MESSAGE } from "../constants";
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
  console.log(`${LOG_PREFIX} handleMessengerIncomingMessage called`, {
    workspaceId,
    credentialsId,
    entryCount: entry.length,
    psid: entry[0]?.messaging[0]?.sender.id,
  });

  // Fire-and-forget: process the flow asynchronously so we return
  // WEBHOOK_SUCCESS_MESSAGE to Facebook immediately and prevent retries.
  (async () => {
    for (const e of entry) {
      for (const messaging of e.messaging) {
        const psid = messaging.sender.id;
        const text = messaging.message?.text ?? messaging.postback?.payload;
        console.log(`${LOG_PREFIX} Processing message`, { psid, text });
        try {
          const result = await resumeMessengerFlow({
            psid,
            text,
            workspaceId,
            credentialsId,
          });
          console.log(`${LOG_PREFIX} resumeMessengerFlow result`, {
            psid,
            result,
          });
        } catch (err) {
          console.error(`${LOG_PREFIX} Error in resumeMessengerFlow`, {
            psid,
            err,
          });
        }
      }
    }
  })();

  return WEBHOOK_SUCCESS_MESSAGE;
};
