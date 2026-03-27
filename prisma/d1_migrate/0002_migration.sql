-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Qr" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "kvId" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "redirectLink" TEXT NOT NULL,
    "scanCount" INTEGER NOT NULL DEFAULT 0,
    "stripePurchaseId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "Qr_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Qr" ("active", "createdAt", "id", "kvId", "redirectLink", "scanCount", "stripePurchaseId", "updatedAt", "userId") SELECT "active", "createdAt", "id", "kvId", "redirectLink", "scanCount", "stripePurchaseId", "updatedAt", "userId" FROM "Qr";
DROP TABLE "Qr";
ALTER TABLE "new_Qr" RENAME TO "Qr";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

