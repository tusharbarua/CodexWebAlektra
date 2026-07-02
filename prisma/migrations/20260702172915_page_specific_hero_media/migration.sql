-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_HeroMedia" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "pageKey" TEXT NOT NULL DEFAULT 'epc',
    "title" TEXT NOT NULL,
    "mediaType" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "filePath" TEXT,
    "posterImagePath" TEXT,
    "alt" TEXT NOT NULL,
    "altText" TEXT,
    "mimeType" TEXT,
    "fileSize" INTEGER,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "status" TEXT NOT NULL DEFAULT 'PUBLISHED',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_HeroMedia" ("alt", "createdAt", "fileSize", "id", "isPrimary", "mediaType", "mimeType", "sortOrder", "status", "title", "updatedAt", "url") SELECT "alt", "createdAt", "fileSize", "id", "isPrimary", "mediaType", "mimeType", "sortOrder", "status", "title", "updatedAt", "url" FROM "HeroMedia";
DROP TABLE "HeroMedia";
ALTER TABLE "new_HeroMedia" RENAME TO "HeroMedia";
UPDATE "HeroMedia" SET "filePath" = "url", "altText" = "alt", "isPublished" = CASE WHEN "status" = 'PUBLISHED' THEN true ELSE false END WHERE "filePath" IS NULL;
CREATE INDEX "HeroMedia_pageKey_isPublished_isPrimary_sortOrder_idx" ON "HeroMedia"("pageKey", "isPublished", "isPrimary", "sortOrder");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
