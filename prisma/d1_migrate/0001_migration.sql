-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "stripeCustomerId" TEXT,
    "monthlySubscription" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Qr" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "kvId" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "redirectLink" TEXT,
    "scanCount" INTEGER NOT NULL DEFAULT 0,
    "stripePurchaseId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "Qr_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Qr_stripePurchaseId_key" ON "Qr"("stripePurchaseId");

