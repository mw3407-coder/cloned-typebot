import { publicProcedure } from "@typebot.io/config/orpc/viewer/middlewares";
import { z } from "zod";
import { WEBHOOK_SUCCESS_MESSAGE } from "../constants";
import { messengerWebhookRequestBodySchema } from "../schemas";
import {
  handleMessengerVerification,
  messengerVerificationInputSchema,
} from "./handleMessengerVerification";
import {
  handleMessengerIncomingMessage,
  messengerIncomingMessageInputSchema,
} from "./handleMessengerIncomingMessage";

export const chatMessengerRouter = {
  verifyWebhook: publicProcedure
    .route({
      method: "GET",
      path: "/v1/workspaces/{workspaceId}/messenger/{credentialsId}/webhook",
      summary: "Verify Messenger webhook",
      tags: ["Messenger"],
    })
    .input(messengerVerificationInputSchema)
    .output(z.string())
    .handler(handleMessengerVerification),

  incomingMessage: publicProcedure
    .route({
      method: "POST",
      path: "/v1/workspaces/{workspaceId}/messenger/{credentialsId}/webhook",
      tags: ["Messenger"],
    })
    .input(messengerIncomingMessageInputSchema)
    .output(z.literal(WEBHOOK_SUCCESS_MESSAGE))
    .handler(handleMessengerIncomingMessage),
};
