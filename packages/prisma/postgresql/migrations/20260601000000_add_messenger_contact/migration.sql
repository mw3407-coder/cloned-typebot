-- CreateTable
CREATE TABLE "MessengerContact" (
    "id" TEXT NOT NULL,
    "psid" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "credentialsId" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "name" TEXT,
    "locale" TEXT,
    "timezone" DOUBLE PRECISION,
    "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MessengerContact_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MessengerContact_psid_key" ON "MessengerContact"("psid");
