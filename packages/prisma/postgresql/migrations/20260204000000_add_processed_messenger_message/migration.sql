CREATE TABLE "ProcessedMessengerMessage" (
    "id" TEXT NOT NULL,
    "mid" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProcessedMessengerMessage_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ProcessedMessengerMessage_mid_key" ON "ProcessedMessengerMessage"("mid");
