import { z } from "zod";

export const messengerWebhookRequestBodySchema = z.object({
  object: z.string(),
  entry: z.array(
    z.object({
      id: z.string(),
      messaging: z.array(
        z.object({
          sender: z.object({ id: z.string() }),
          recipient: z.object({ id: z.string() }),
          timestamp: z.number(),
          message: z
            .object({
              mid: z.string(),
              text: z.string().optional(),
            })
            .optional(),
          postback: z
            .object({
              payload: z.string(),
              title: z.string().optional(),
            })
            .optional(),
        }),
      ),
    }),
  ),
});

export type MessengerWebhookRequestBody = z.infer<
  typeof messengerWebhookRequestBodySchema
>;
