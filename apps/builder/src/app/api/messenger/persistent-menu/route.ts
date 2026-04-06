import { decryptV2 } from "@typebot.io/credentials/decryptV2";
import { getCredentials } from "@typebot.io/credentials/getCredentials";
import prisma from "@typebot.io/prisma";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@typebot.io/auth/lib/nextAuth";

const GRAPH_API = "https://graph.facebook.com/v19.0";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { credentialsId, workspaceId, menuItems } = await req.json();

    if (!credentialsId || !workspaceId || !menuItems) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const encryptedCredentials = await getCredentials(credentialsId, workspaceId);
    if (!encryptedCredentials) {
      return NextResponse.json({ error: "Credentials not found" }, { status: 404 });
    }

    const decrypted = (await decryptV2(
      encryptedCredentials.data as string,
      encryptedCredentials.iv as string
    )) as { pageAccessToken?: string };

    const pageAccessToken = decrypted.pageAccessToken;
    if (!pageAccessToken) {
      return NextResponse.json({ error: "Page Access Token is missing from credentials" }, { status: 400 });
    }

    const fbBody = {
      persistent_menu: [
        {
          locale: "default",
          composer_input_disabled: false,
          call_to_actions: menuItems.map((item: any) => ({
            type: item.type,
            title: item.title,
            ...(item.type === "postback" ? { payload: item.payload } : { url: item.url }),
          })),
        },
      ],
    };

    const res = await fetch(`${GRAPH_API}/me/messenger_profile?access_token=${pageAccessToken}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(fbBody),
    });

    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json({ error: `Meta API error: ${JSON.stringify(data)}` }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Messenger] Persistent Menu error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
