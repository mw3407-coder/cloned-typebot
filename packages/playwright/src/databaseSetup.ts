import { encrypt } from "@typebot.io/credentials/encrypt";
import type { StripeCredentials } from "@typebot.io/credentials/schemas";
import { env } from "@typebot.io/env";
import prisma from "@typebot.io/prisma";
import { Plan, WorkspaceRole } from "@typebot.io/prisma/enum";

// ⚠️ Generate your own API token: openssl rand -hex 32
export const apiToken = process.env.TYPEBOT_API_TOKEN || "CHANGE_THIS_IN_PRODUCTION";

export const proWorkspaceId = "proWorkspace";
export const freeWorkspaceId = "freeWorkspace";
export const starterWorkspaceId = "starterWorkspace";
export const lifetimeWorkspaceId = "lifetimeWorkspaceId";
export const customWorkspaceId = "customWorkspaceId";

const setupWorkspaces = async () => {
  await prisma.workspace.createMany({
    data: [
      {
        id: freeWorkspaceId,
        name: "Free workspace",
        plan: Plan.FREE,
      },
      {
        id: starterWorkspaceId,
        name: "Starter workspace",
        stripeId: process.env.STRIPE_CUSTOMER_ID || "",
        plan: Plan.STARTER,
      },
      {
        id: proWorkspaceId,
        name: "Pro workspace",
        plan: Plan.PRO,
      },
      {
        id: lifetimeWorkspaceId,
        name: "Lifetime workspace",
        plan: Plan.LIFETIME,
      },
      {
        id: customWorkspaceId,
        name: "Custom workspace",
        plan: Plan.CUSTOM,
        customChatsLimit: 100000,
        customStorageLimit: 50,
        customSeatsLimit: 20,
      },
    ],
  });
};

export const setupUsers = async () => {
  const authenticatedUser = await prisma.user.findFirst({
    where: {
      email: process.env.TYPEBOT_ADMIN_EMAIL || "admin@yourdomain.com",
    },
  });
  if (!authenticatedUser) {
    throw new Error("Authenticated user not found");
  }
  await prisma.apiToken.createMany({
    data: [
      {
        ownerId: authenticatedUser.id,
        name: "Token 1",
        token: process.env.TYPEBOT_API_TOKEN || "CHANGE_THIS_IN_PRODUCTION",
        createdAt: new Date(2022, 1, 1),
      },
      {
        ownerId: authenticatedUser.id,
        name: "Github",
        token: process.env.TYPEBOT_GITHUB_TOKEN || "CHANGE_THIS_IN_PRODUCTION",
        createdAt: new Date(2022, 1, 2),
      },
      {
        ownerId: authenticatedUser.id,
        name: "N8n",
        token: process.env.TYPEBOT_N8N_TOKEN || "CHANGE_THIS_IN_PRODUCTION",
        createdAt: new Date(2022, 1, 3),
      },
    ],
  });
  return prisma.memberInWorkspace.createMany({
    data: [
      {
        role: WorkspaceRole.ADMIN,
        userId: authenticatedUser.id,
        workspaceId: freeWorkspaceId,
      },
      {
        role: WorkspaceRole.ADMIN,
        userId: authenticatedUser.id,
        workspaceId: starterWorkspaceId,
      },
      {
        role: WorkspaceRole.ADMIN,
        userId: authenticatedUser.id,
        workspaceId: proWorkspaceId,
      },
      {
        role: WorkspaceRole.ADMIN,
        userId: authenticatedUser.id,
        workspaceId: lifetimeWorkspaceId,
      },
      {
        role: WorkspaceRole.ADMIN,
        userId: authenticatedUser.id,
        workspaceId: customWorkspaceId,
      },
    ],
  });
};

const setupCredentials = async () => {
  // ⚠️ Google OAuth tokens - Replace with your own or leave empty if not using Google Sheets
  const { encryptedData, iv } = await encrypt({
    expiry_date: parseInt(process.env.GOOGLE_OAUTH_EXPIRY_DATE || "0"),
    access_token: process.env.GOOGLE_OAUTH_ACCESS_TOKEN || "",
    // This token is linked to a test Google account (typebot.test.user@gmail.com)
    refresh_token: process.env.GOOGLE_OAUTH_REFRESH_TOKEN || "",
  });
  
  const { encryptedData: stripeEncryptedData, iv: stripeIv } = await encrypt({
    test: {
      publicKey: env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY || "",
      secretKey: env.STRIPE_SECRET_KEY || "",
    },
    live: {
      publicKey: env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY || "",
      secretKey: env.STRIPE_SECRET_KEY || "",
    },
  } satisfies StripeCredentials["data"]);
  
  const { encryptedData: mistralEncryptedData, iv: mistralIv } = await encrypt({
    apiKey: process.env.MISTRAL_API_KEY || "",
  });
  
  return prisma.credentials.createMany({
    data: [
      {
        name: "Google Sheets",
        type: "google sheets",
        data: encryptedData,
        workspaceId: proWorkspaceId,
        iv,
      },
      {
        id: "stripe",
        name: "Stripe",
        type: "stripe",
        data: stripeEncryptedData,
        workspaceId: proWorkspaceId,
        iv: stripeIv,
      },
      {
        id: "mistral",
        name: "Mistral",
        type: "mistral",
        data: mistralEncryptedData,
        workspaceId: proWorkspaceId,
        iv: mistralIv,
      },
    ],
  });
};

export const setupDatabase = async () => {
  await setupWorkspaces();
  await setupUsers();
  return setupCredentials();
};

export const teardownDatabase = async () => {
  const existingUser = await prisma.user.findFirst({
    where: {
      email: process.env.TYPEBOT_ADMIN_EMAIL || "admin@yourdomain.com",
    },
  });
  if (!existingUser) {
    console.warn("Authenticated user not found");
    return;
  }
  await prisma.apiToken.deleteMany({
    where: {
      ownerId: existingUser.id,
    },
  });
  await prisma.webhook.deleteMany({
    where: {
      typebot: {
        workspace: {
          members: {
            some: { userId: { in: [existingUser.id] } },
          },
        },
      },
    },
  });
  await prisma.workspace.deleteMany({
    where: {
      members: {
        some: { userId: { in: [existingUser.id] } },
      },
    },
  });
  await prisma.workspace.deleteMany({
    where: {
      id: {
        in: [
          proWorkspaceId,
          freeWorkspaceId,
          starterWorkspaceId,
          lifetimeWorkspaceId,
          customWorkspaceId,
        ],
      },
    },
  });
};
