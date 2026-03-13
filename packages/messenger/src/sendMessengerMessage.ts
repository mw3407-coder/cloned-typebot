const GRAPH_API = "https://graph.facebook.com/v19.0";

type QuickReply = {
  content_type: "text";
  title: string;
  payload: string;
};

type MessengerMessage =
  | { text: string }
  | { text: string; quick_replies: QuickReply[] };

export const sendMessengerMessage = async ({
  to,
  message,
  pageAccessToken,
}: {
  to: string;
  message: MessengerMessage;
  pageAccessToken: string;
}): Promise<void> => {
  const res = await fetch(
    `${GRAPH_API}/me/messages?access_token=${pageAccessToken}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recipient: { id: to },
        message,
      }),
    },
  );
  if (res.ok === false) {
    const data = await res.json();
    throw new Error(`Messenger API error: ${JSON.stringify(data)}`);
  }
};
