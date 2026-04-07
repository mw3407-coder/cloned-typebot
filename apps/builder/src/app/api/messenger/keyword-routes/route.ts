import { auth } from "@typebot.io/auth/lib/nextAuth";
import prisma from "@typebot.io/prisma";
import { type NextRequest, NextResponse } from "next/server";
import { isWriteWorkspaceForbidden } from "@/features/workspace/helpers/isWriteWorkspaceForbidden";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const workspaceId = searchParams.get("workspaceId");
  const credentialsId = searchParams.get("credentialsId");

  if (!workspaceId || !credentialsId)
    return NextResponse.json(
      { error: "Missing workspaceId or credentialsId" },
      { status: 400 },
    );

  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: { members: { select: { userId: true, role: true } } },
  });

  if (!workspace || isWriteWorkspaceForbidden(workspace, session.user))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const routes = await prisma.messengerKeywordRoute.findMany({
    where: { workspaceId, credentialsId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ routes });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { workspaceId, credentialsId, keyword, typebotId } = await req.json();

  if (!workspaceId || !credentialsId || !keyword || !typebotId)
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: { members: { select: { userId: true, role: true } } },
  });

  if (!workspace || isWriteWorkspaceForbidden(workspace, session.user))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const targetTypebot = await prisma.typebot.findFirst({
    where: { id: typebotId, workspaceId },
  });

  if (!targetTypebot)
    return NextResponse.json(
      { error: "Target flow not found in this workspace" },
      { status: 404 },
    );

  const route = await prisma.messengerKeywordRoute.upsert({
    where: {
      workspaceId_credentialsId_keyword: {
        workspaceId,
        credentialsId,
        keyword: keyword.trim().toUpperCase(),
      },
    },
    update: { typebotId },
    create: {
      workspaceId,
      credentialsId,
      keyword: keyword.trim().toUpperCase(),
      typebotId,
    },
  });

  return NextResponse.json({ route });
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id)
    return NextResponse.json({ error: "Missing route id" }, { status: 400 });

  const route = await prisma.messengerKeywordRoute.findUnique({
    where: { id },
  });

  if (!route)
    return NextResponse.json({ error: "Route not found" }, { status: 404 });

  const workspace = await prisma.workspace.findUnique({
    where: { id: route.workspaceId },
    select: { members: { select: { userId: true, role: true } } },
  });

  if (!workspace || isWriteWorkspaceForbidden(workspace, session.user))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await prisma.messengerKeywordRoute.delete({
    where: { id },
  });

  return NextResponse.json({ success: true });
}
