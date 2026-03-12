import { ORPCError } from "@orpc/server";
import { env } from "@typebot.io/env";
import { z } from "zod";

export const messengerVerificationInputSchema = z.object({
  workspaceId: z.string(),
  credentialsId: z.string(),
  "hub.mode": z.string(),
  "hub.challenge": z.string(),
  "hub.verify_token": z.string(),
});

export const handleMessengerVerification = async ({
  input,
}: {
  input: z.infer<typeof messengerVerificationInputSchema>;
}) => {
  const verifyToken = env.MESSENGER_VERIFY_TOKEN;
  if (verifyToken === undefined || verifyToken === "") {
    throw new ORPCError("INTERNAL_SERVER_ERROR", {
      message: "MESSENGER_VERIFY_TOKEN env var is not set",
    });
  }
  if (input["hub.verify_token"] !== verifyToken) {
    throw new ORPCError("UNAUTHORIZED", {
      message: "Invalid verify token",
    });
  }
  // Return as plain text so Facebook receives the raw challenge value
  // (not JSON-wrapped in quotes, which causes validation to fail).
  return {
    headers: { "content-type": "text/plain" },
    body: input["hub.challenge"],
  };
};
