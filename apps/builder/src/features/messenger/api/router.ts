import { authenticatedProcedure } from "@typebot.io/config/orpc/builder/middlewares";
import { z } from "zod";
import {
  handleStartMessengerPreview,
  startMessengerPreviewInputSchema,
} from "./handleStartMessengerPreview";

export const builderMessengerRouter = {
  startMessengerPreview: authenticatedProcedure
    .route({
      method: "POST",
      path: "/v1/typebots/{typebotId}/messenger/start-preview",
      summary: "Start Messenger preview",
      tags: ["Messenger"],
    })
    .input(startMessengerPreviewInputSchema)
    .output(z.object({ message: z.string() }))
    .handler(handleStartMessengerPreview),
};
