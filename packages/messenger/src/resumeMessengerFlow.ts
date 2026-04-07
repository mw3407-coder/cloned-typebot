import { continueBotFlow } from "@typebot.io/bot-engine/continueBotFlow";
import { saveStateToDatabase } from "@typebot.io/bot-engine/saveStateToDatabase";
import { startSession } from "@typebot.io/bot-engine/startSession";
import { getSession } from "@typebot.io/chat-session/queries/getSession";
import { upsertSession } from "@typebot.io/chat-session/queries/upsertSession";
import { decrypt } from "@typebot.io/credentials/decrypt";
import { getCredentials } from "@typebot.io/credentials/getCredentials";
import prisma from "@typebot.io/prisma";
import { withSessionStore } from "@typebot.io/runtime-session-store";
import { LOG_PREFIX, MESSENGER_SESSION_ID_PREFIX } from "./constants";
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
  overrideTypebotId?: string;
};

export const resumeMessengerFlow = async ({
  psid,
  text,
  workspaceId,
  credentialsId,
  overrideTypebotId,
}: Props): Promise<void> => {
  console.log(`${LOG_PREFIX} resumeMessengerFlow`, { psid, workspaceId });

  const encryptedCredentials = await getCredentials(credentialsId, workspaceId);
  if (encryptedCredentials === null) {
    console.error(`${LOG_PREFIX} Messenger credentials not found`, {
      credentialsId,
      psid,
    });
    return;
  }

  const decrypted = (await decrypt(
    encryptedCredentials.data as string,
    encryptedCredentials.iv as string,
  )) as { pageAccessToken?: string };

  const pageAccessToken = decrypted.pageAccessToken;
  if (pageAccessToken === undefined) {
    console.error(`${LOG_PREFIX} Page access token missing in credentials`, {
      psid,
    });
    return;
  }

  const sessionId = `${MESSENGER_SESSION_ID_PREFIX}${credentialsId}-${psid}`;

  const session = await getSession(sessionId);

  if (session?.isReplying) {
    console.log(`${LOG_PREFIX} Session is already replying, skipping`, {
      psid,
    });
    return;
  }

  await upsertSession(sessionId, { isReplying: true });

  try {
    await withSessionStore(sessionId, async (sessionStore) => {
      const result = await resumeFlow({
        state: session?.state,
        text,
        workspaceId,
        sessionStore,
        overrideTypebotId,
      });

      if (result === null) {
        console.warn(
          `${LOG_PREFIX} resumeFlow returned null, restarting session`,
          { psid },
        );
        const startResult = await startNewSession({
          workspaceId,
          sessionStore,
          overrideTypebotId,
        });
        await processFlowResult({
          psid,
          pageAccessToken,
          sessionId,
          result: startResult,
        });
        return;
      }

      await processFlowResult({
        psid,
        pageAccessToken,
        sessionId,
        result,
      });
    });
  } catch (err) {
    console.error(`${LOG_PREFIX} Error in resumeMessengerFlow execution`, {
      psid,
      err,
    });
    await prisma.chatSession
      .delete({ where: { id: sessionId } })
      .catch(() => {});
    await sendMessengerMessage({
      to: psid,
      message: { text: "Sorry, something went wrong. Please try again." },
      pageAccessToken,
    });
  }
};

const resumeFlow = async ({
  state,
  text,
  workspaceId,
  sessionStore,
  overrideTypebotId,
}: {
  state: any;
  text: string | undefined;
  workspaceId: string;
  sessionStore: any;
  overrideTypebotId?: string;
}) => {
  if (state) {
    const reply =
      text !== undefined ? { type: "text" as const, text } : undefined;
    return continueBotFlow(reply, {
      version: 2,
      sessionStore,
      state,
      textBubbleContentFormat: "richText",
    });
  }

  return startNewSession({ workspaceId, sessionStore, overrideTypebotId });
};

const startNewSession = async ({
  workspaceId,
  sessionStore,
  overrideTypebotId,
}: {
  workspaceId: string;
  sessionStore: any;
  overrideTypebotId?: string;
}) => {
  const typebotRecord = await prisma.typebot.findFirst({
    where: overrideTypebotId ? { id: overrideTypebotId } : { workspaceId },
    select: { id: true, publicId: true },
  });

  if (typebotRecord === null) {
    throw new Error(`No typebot found for workspace ${workspaceId}`);
  }

  if (typebotRecord.publicId === null) {
    throw new Error(`Typebot has no publicId ${typebotRecord.id}`);
  }

  return startSession({
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
};

const processFlowResult = async ({
  psid,
  pageAccessToken,
  sessionId,
  result,
}: {
  psid: string;
  pageAccessToken: string;
  sessionId: string;
  result: Awaited<ReturnType<typeof continueBotFlow>>;
}) => {
  if (result === null) return;
  const {
    messages,
    input,
    newSessionState,
    logs,
    visitedEdges,
    setVariableHistory,
  } = result;

  if (messages.length === 0) {
    console.warn(`${LOG_PREFIX} Flow returned no messages for psid:`, psid);
    await upsertSession(sessionId, { isReplying: false });
    return;
  }

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
    const inputMessage = convertInputToMessengerMessage(input, lastMessageText);
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
    sessionId: { type: "existing", id: sessionId },
    session: { state: newSessionState },
    isWaitingForExternalEvent: false,
    visitedEdges,
    setVariableHistory,
  });

  await upsertSession(sessionId, { isReplying: false });
};
