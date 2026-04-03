-- AlterTable
ALTER TABLE "DailyTask" ADD COLUMN     "deadline" TIMESTAMP(3),
ADD COLUMN     "notifyHoursBefore" INTEGER;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "discordWebhook" TEXT,
ADD COLUMN     "notifyHoursBefore" INTEGER NOT NULL DEFAULT 1;

-- CreateTable
CREATE TABLE "UserTask" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "taskKey" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserTask_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserTask_userId_taskKey_key" ON "UserTask"("userId", "taskKey");

-- AddForeignKey
ALTER TABLE "UserTask" ADD CONSTRAINT "UserTask_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
