-- CreateTable
CREATE TABLE "Credit" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "shopifyOrderId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Credit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Qr" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "kvId" TEXT NOT NULL,
    "nickname" TEXT NOT NULL DEFAULT 'QR Dynamics',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "redirectLink" TEXT NOT NULL,
    "scanCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "userId" TEXT NOT NULL,
    "creditId" TEXT,
    CONSTRAINT "Qr_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Qr_creditId_fkey" FOREIGN KEY ("creditId") REFERENCES "Credit" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Qr" ("active", "createdAt", "id", "kvId", "redirectLink", "scanCount", "updatedAt", "userId") SELECT "active", "createdAt", "id", "kvId", "redirectLink", "scanCount", "updatedAt", "userId" FROM "Qr";
DROP TABLE "Qr";
ALTER TABLE "new_Qr" RENAME TO "Qr";
CREATE UNIQUE INDEX "Qr_kvId_key" ON "Qr"("kvId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

