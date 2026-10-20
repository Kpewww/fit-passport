-- Session 100: what happened (events) and what people told us (feedback), for a pilot.
-- Additive only.
CREATE TABLE "Event" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "name" TEXT NOT NULL,
    "detail" TEXT,
    "path" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Event_name_createdAt_idx" ON "Event"("name", "createdAt");
CREATE INDEX "Event_userId_idx" ON "Event"("userId");

CREATE TABLE "Feedback" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "message" TEXT NOT NULL,
    "contact" TEXT,
    "path" TEXT,
    "locale" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Feedback_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Feedback_createdAt_idx" ON "Feedback"("createdAt");
