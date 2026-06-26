CREATE TABLE "SiteSettings" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "singletonKey" TEXT NOT NULL DEFAULT 'footer',
  "contactEmail" TEXT NOT NULL DEFAULT 'contact@alektraepc.com',
  "contactPhone" TEXT NOT NULL DEFAULT '+880 1735954 844',
  "address" TEXT NOT NULL DEFAULT 'Dhaka, Bangladesh',
  "facebookUrl" TEXT,
  "linkedinUrl" TEXT,
  "youtubeUrl" TEXT,
  "whatsappNumber" TEXT,
  "footerDescription" TEXT NOT NULL DEFAULT 'Solar EPC, thermal inspection, cleaning and mapping for renewable-energy assets in Bangladesh.',
  "copyrightText" TEXT NOT NULL DEFAULT 'Copyright (c) Alektra Renewable. All rights reserved.',
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
);

CREATE UNIQUE INDEX "SiteSettings_singletonKey_key" ON "SiteSettings"("singletonKey");

PRAGMA foreign_keys=OFF;

CREATE TABLE "new_ProductImage" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "productId" TEXT NOT NULL,
  "imagePath" TEXT NOT NULL,
  "altText" TEXT NOT NULL,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "isPrimary" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "ProductImage_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

INSERT INTO "new_ProductImage" ("id", "productId", "imagePath", "altText", "sortOrder", "isPrimary", "createdAt", "updatedAt")
SELECT "id", "productId", "url", "alt", "sortOrder", CASE WHEN "sortOrder" = 0 THEN true ELSE false END, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "ProductImage";

DROP TABLE "ProductImage";
ALTER TABLE "new_ProductImage" RENAME TO "ProductImage";

PRAGMA foreign_keys=ON;
