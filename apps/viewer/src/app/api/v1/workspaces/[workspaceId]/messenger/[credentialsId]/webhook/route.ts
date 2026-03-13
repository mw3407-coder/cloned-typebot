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
      if (entry.changes) {
        for (const change of entry.changes) {
          if (change.field === "feed" && change.value?.item === "comment" && change.value?.verb === "add") {
            const psid = change.value?.sender?.id ?? change.value?.from?.id;
            const text = change.value?.message;
            if (!psid || !text) continue;
            await resumeMessengerFlow({ workspaceId, credentialsId, psid, message: text });
          }
        }
        continue;
      }
      for (const messaging of entry.messaging ?? []) {
        if (messaging.message?.is_echo) continue;
        if (messaging.delivery || messaging.read) continue;
        const psid = messaging.sender?.id;
        const text =
          messaging.postback?.payload ??
          messaging.message?.quick_reply?.payload ??
          messaging.message?.text;
        if (!psid || !text) continue;
        await resumeMessengerFlow({ workspaceId, credentialsId, psid, message: text });
      }
    }
  });

  return NextResponse.json({ status: "ok" });
}
