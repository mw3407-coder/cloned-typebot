import { ORPCError } from "@orpc/server";
import { decryptV2 } from "@typebot.io/credentials/decryptV2";
import { getCredentials } from "@typebot.io/credentials/getCredentials";
import { createToastORPCError } from "@typebot.io/lib/createToastORPCError";
import prisma from "@typebot.io/prisma";
import { isReadTypebotForbidden } from "@typebot.io/typebot/helpers/isReadTypebotForbidden";
import type { User } from "@typebot.io/user/schemas";
import { z } from "zod";

const GRAPH_API = "https://graph.facebook.com/v19.0";

export const startMessengerPreviewInputSchema = z.object({
  psid: z.string().min(1),
  typebotId: z.string(),
});

export const handleStartMessengerPreview = async ({
  input: { psid, typebotId },
  context: { user },
}: {
  input: z.infer<typeof startMessengerPreviewInputSchema>;
  context: { user: Pick<User, "id" | "email"> };
}) => {
  const existingTypebot = await prisma.typebot.findFirst({
    where: { id: typebotId },
    select: {
      id: true,
      groups: true,
      workspace: {
        select: {
          isSuspended: true,
          isPastDue: true,
          id: true,
          members: { select: { userId: true } },
        },
      },
      collaborators: { select: { userId: true } },
    },
  });

  if (
    !existingTypebot?.id ||
    (await isReadTypebotForbidden(existingTypebot, user))
  )
    throw new ORPCError("NOT_FOUND", { message: "Typebot not found" });

  const groups = existingTypebot.groups as {
    blocks: { type: string; options?: { credentialsId?: string } }[];
  }[];

  let credentialsId: string | undefined;
  for (const group of groups) {
    for (const block of group.blocks) {
      if (block.type === "facebookMessenger" && block.options?.credentialsId) {
        credentialsId = block.options.credentialsId;
        break;
      }
    }
    if (credentialsId) break;
  }

  if (!credentialsId)
    throw new ORPCError("BAD_REQUEST", {
      message:
        "No Facebook Messenger block with credentials found in this typebot. Add a Messenger block and connect your account first.",
    });

  const encryptedCredentials = await getCredentials(
    credentialsId,
    existingTypebot.workspace.id,
  );

  if (!encryptedCredentials)
    throw new ORPCError("NOT_FOUND", { message: "Credentials not found" });

  const decrypted = (await decryptV2(
    encryptedCredentials.data as string,
    encryptedCredentials.iv as string,
  )) as { pageAccessToken?: string };

  const pageAccessToken = decrypted.pageAccessToken;
  if (!pageAccessToken)
    throw new ORPCError("BAD_REQUEST", {
      message: "Page Access Token is missing from credentials",
    });

  try {
    const res = await fetch(
      `${GRAPH_API}/me/messages?access_token=${pageAccessToken}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipient: { id: psid },
          message: { text: "👋 Preview started! Your Typebot is connected." },
        }),
      },
    );
    const data = await res.json();
    if (!res.ok)
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: `Messenger API error: ${JSON.stringify(data)}`,
      });
    return { message: "success" };
  } catch (error) {
    if (error instanceof ORPCError) throw error;
    throw await createToastORPCError(error);
  }
};
