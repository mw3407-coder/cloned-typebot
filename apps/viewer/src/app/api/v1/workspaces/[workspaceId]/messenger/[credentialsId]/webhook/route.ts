import { env } from "@typebot.io/env";
import { resumeMessengerFlow } from "@typebot.io/messenger/resumeMessengerFlow";
import { after, NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");
  if (mode === "subscribe" && token === env.MESSENGER_VERIFY_TOKEN && challenge) {
    return new NextResponse(challenge, {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  }
  return new NextResponse("Forbidden", { status: 403 });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; credentialsId: string }> }
) {
  const { workspaceId, credentialsId } = await params;
  const body = await request.json();
  after(async () => {
    for (const entry of body.entry ?? []) {
      for (const messaging of entry.messaging ?? []) {
        const psid = messaging.sender?.id;
        const text = messaging.message?.text ?? messaging.postback?.payload;
        if (psid) {
          await resumeMessengerFlow({ psid, text, workspaceId, credentialsId }).catch(
            (err) => console.error("[Messenger] resumeMessengerFlow error", err)
          );
        }
      }
    }
  });
  return new NextResponse("EVENT_RECEIVED", { status: 200 });
}
