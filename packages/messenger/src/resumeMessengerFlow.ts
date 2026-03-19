import { continueBotFlow } from "@typebot.io/bot-engine/continueBotFlow";
import { saveStateToDatabase } from "@typebot.io/bot-engine/saveStateToDatabase";
import { startSession } from "@typebot.io/bot-engine/startSession";
import { getSession } from "@typebot.io/chat-session/queries/getSession";
import { upsertSession } from "@typebot.io/chat-session/queries/upsertSession";
import { decrypt } from "@typebot.io/credentials/decrypt";
import { getCredentials } from "@typebot.io/credentials/getCredentials";
import prisma from "@typebot.io/prisma";
import { withSessionStore } from "@typebot.io/runtime-session-store";
import { MESSENGER_SESSION_ID_PREFIX } from "./constants";
import { convertInputToMessengerMessage } from "./convertInputToMessengerMessage";
import { sendMessengerMessage } from "./sendMessengerMessage";
import { sendTypingIndicator } from "./sendTypingIndicator";

type RichTextBlock = { children?: { text?: string }[] };

type BotMessage = {
  type: string;
  content: string | { richText?: RichTextBlock[] };
};

function extractText(message: BotMessage): string {
  if (typeof message.content === "string") return message.content;
  return (message.content.richText ?? [])
    .map((block) => (block.children ?? []).map((c) => c.text ?? "").join(""))
    .join(" ");
}

type Props = {
  psid: string;
  text: string | undefined;
  workspaceId: string;
  credentialsId: string;
};

export const resumeMessengerFlow = async ({
  psid,
  text,
  workspaceId,
  credentialsId,
}: Props): Promise<void> => {
  console.log("[Messenger] resumeMessengerFlow start");

  const encryptedCredentials = await getCredentials(credentialsId, workspaceId);
  if (encryptedCredentials === null) {
    console.error("Messenger credentials not found", credentialsId);
    return;
  }

  const decrypted = (await decrypt(
    encryptedCredentials.data as string,
    encryptedCredentials.iv as string,
  )) as { pageAccessToken?: string };

  const pageAccessToken = decrypted.pageAccessToken;
  if (pageAccessToken === undefined) {
    console.error("Page access token missing in credentials");
    return;
  }

  const sessionId = `${MESSENGER_SESSION_ID_PREFIX}${credentialsId}-${psid}`;

  await withSessionStore(sessionId, async (sessionStore) => {
    const existingSession = await getSession(sessionId);

    if (
      existingSession?.state !== undefined &&
      existingSession?.state !== null
    ) {
      const reply =
        text !== undefined ? { type: "text" as const, text } : undefined;

      let continueResult: Awaited<ReturnType<typeof continueBotFlow>> | null =
        null;
      try {
        continueResult = await continueBotFlow(reply, {
          version: 2,
          sessionStore,
          state: existingSession.state,
          textBubbleContentFormat: "richText",
        });
      } catch (err) {
        console.log("[Messenger] Session stuck — resetting for psid:", psid);
        await prisma.chatSession
          .delete({ where: { id: sessionId } })
          .catch(() => {});
        return;
      }

      // If session was reset, fall through to startSession below
      if (continueResult === null) {
        existingSession.state = undefined as any;
      }

      if (continueResult !== null) {
        const {
          messages,
          input,
          logs,
          visitedEdges,
          setVariableHistory,
          newSessionState,
        } = continueResult;

        let lastMessageText: string | undefined;
        for (const message of messages) {
          if (message.type === "text") {
            const plainText = extractText(message as BotMessage);
            if (plainText.length > 0) {
              await sendTypingIndicator(
                psid,
                pageAccessToken,
                plainText.length,
              );
              await sendMessengerMessage({
                to: psid,
                message: { text: plainText },
                pageAccessToken,
              });
              lastMessageText = plainText;
            }
          }
        }

        if (input) {
          const inputMessage = convertInputToMessengerMessage(
            input,
            lastMessageText,
          );
          if (inputMessage) {
            await sendTypingIndicator(psid, pageAccessToken, 40);
            await sendMessengerMessage({
              to: psid,
              message: inputMessage,
              pageAccessToken,
            });
          }
        }

        await saveStateToDatabase({
          clientSideActions: [],
          input,
          logs,
          sessionId: { type: "new", id: sessionId },
          session: { state: newSessionState },
          visitedEdges,
          setVariableHistory,
        });
      } // end if (continueResult !== null)
    }

    if (!existingSession?.state) {
      const typebotRecord = await prisma.typebot.findFirst({
        where: { workspaceId },
        select: { id: true, publicId: true },
      });

      if (typebotRecord === null) {
        console.error("No typebot found for workspace", workspaceId);
        return;
      }

      if (typebotRecord.publicId === null) {
        console.error("Typebot has no publicId", typebotRecord.id);
        return;
      }

      const {
        messages,
        input,
        newSessionState,
        logs,
        visitedEdges,
        setVariableHistory,
      } = await startSession({
        version: 2,
        sessionStore,
        startParams: {
          type: "live",
          isOnlyRegistering: false,
          publicId: typebotRecord.publicId,
          isStreamEnabled: false,
          textBubbleContentFormat: "richText",
        },
      });

      let lastMessageText: string | undefined;
      for (const message of messages) {
        if (message.type === "text") {
          const plainText = extractText(message as BotMessage);
          if (plainText.length > 0) {
            await sendTypingIndicator(psid, pageAccessToken, plainText.length);
            await sendMessengerMessage({
              to: psid,
              message: { text: plainText },
              pageAccessToken,
            });
            lastMessageText = plainText;
          }
        }
      }

      if (input) {
        const inputMessage = convertInputToMessengerMessage(
          input,
          lastMessageText,
        );
        if (inputMessage) {
          await sendTypingIndicator(psid, pageAccessToken, 40);
          await sendMessengerMessage({
            to: psid,
            message: inputMessage,
            pageAccessToken,
          });
        }
      }

      await upsertSession(sessionId, {
        state: newSessionState,
        isReplying: false,
      });

      await saveStateToDatabase({
        clientSideActions: [],
        input,
        logs,
        sessionId: { type: "existing", id: sessionId },
        session: { state: newSessionState },
        visitedEdges,
        setVariableHistory,
      });
    }
  }).catch((err) => {
    console.error("[Messenger] withSessionStore threw:", err);
  });
};
