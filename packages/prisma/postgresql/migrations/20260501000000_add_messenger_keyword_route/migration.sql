-- CreateTable
CREATE TABLE "MessengerKeywordRoute" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "credentialsId" TEXT NOT NULL,
    "keyword" TEXT NOT NULL,
    "typebotId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MessengerKeywordRoute_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MessengerKeywordRoute_workspaceId_credentialsId_keyword_key" ON "MessengerKeywordRoute"("workspaceId", "credentialsId", "keyword");
