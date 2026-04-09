import { decrypt } from "@typebot.io/credentials/decrypt";
import { getCredentials } from "@typebot.io/credentials/getCredentials";
import prisma from "@typebot.io/prisma";
import { z } from "zod";
import { LOG_PREFIX, WEBHOOK_SUCCESS_MESSAGE } from "../constants";
import { fetchMessengerProfile } from "../fetchMessengerProfile";
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
    const encryptedCredentials = await getCredentials(
      credentialsId,
      workspaceId,
    );
    const decrypted = encryptedCredentials
      ? ((await decrypt(
          encryptedCredentials.data as string,
          encryptedCredentials.iv as string,
        )) as { pageAccessToken?: string })
      : {};
    const pageAccessToken = decrypted.pageAccessToken;

    for (const e of entry) {
      for (const messaging of e.messaging) {
        const psid = messaging.sender.id;

        if (pageAccessToken) {
          const existingContact = await prisma.messengerContact.findUnique({
            where: { psid },
          });

          if (!existingContact) {
            fetchMessengerProfile(
              psid,
              workspaceId,
              credentialsId,
              pageAccessToken,
            ).catch((err) =>
              console.warn(`${LOG_PREFIX} Failed to fetch user profile:`, err),
            );
          } else {
            prisma.messengerContact
              .update({
                where: { psid },
                data: { lastSeenAt: new Date() },
              })
              .catch((err) =>
                console.warn(
                  `${LOG_PREFIX} Failed to update lastSeenAt:`,
                  err,
                ),
              );
          }
        }

        const text =
          messaging.message?.quick_reply?.payload ??
          messaging.message?.text ??
          messaging.postback?.payload ??
          messaging.postback?.title;
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
