CREATE TABLE "LegalDocument" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "documentKey" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "version" TEXT NOT NULL DEFAULT 'v1.0',
    "effectiveDate" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'PUBLISHED',
    "updatedBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

CREATE UNIQUE INDEX "LegalDocument_documentKey_key" ON "LegalDocument"("documentKey");
CREATE UNIQUE INDEX "LegalDocument_slug_key" ON "LegalDocument"("slug");
