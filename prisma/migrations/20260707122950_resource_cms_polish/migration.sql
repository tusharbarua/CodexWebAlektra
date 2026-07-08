-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ResourceArticle" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "excerpt" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "coverImage" TEXT,
    "coverImageAlt" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "readTimeMinutes" INTEGER,
    "categoryId" TEXT NOT NULL,
    "authorId" TEXT,
    "publishedAt" DATETIME,
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ResourceArticle_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ResourceCategory" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ResourceArticle_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_ResourceArticle" ("authorId", "body", "categoryId", "coverImage", "coverImageAlt", "createdAt", "excerpt", "id", "publishedAt", "seoDescription", "seoTitle", "slug", "status", "title", "updatedAt") SELECT "authorId", "body", "categoryId", "coverImage", "coverImageAlt", "createdAt", "excerpt", "id", "publishedAt", "seoDescription", "seoTitle", "slug", "status", "title", "updatedAt" FROM "ResourceArticle";
DROP TABLE "ResourceArticle";
ALTER TABLE "new_ResourceArticle" RENAME TO "ResourceArticle";
CREATE UNIQUE INDEX "ResourceArticle_slug_key" ON "ResourceArticle"("slug");
CREATE TABLE "new_ResourceCategory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "icon" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'PUBLISHED'
);
INSERT INTO "new_ResourceCategory" ("description", "id", "name", "slug", "sortOrder") SELECT "description", "id", "name", "slug", "sortOrder" FROM "ResourceCategory";
DROP TABLE "ResourceCategory";
ALTER TABLE "new_ResourceCategory" RENAME TO "ResourceCategory";
CREATE UNIQUE INDEX "ResourceCategory_slug_key" ON "ResourceCategory"("slug");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
