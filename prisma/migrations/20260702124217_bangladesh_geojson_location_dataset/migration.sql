/*
  Warnings:

  - You are about to drop the `LocationApiSetting` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "LocationApiSetting";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "LocationDatasetSetting" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "singletonKey" TEXT NOT NULL DEFAULT 'default',
    "providerName" TEXT NOT NULL DEFAULT 'bangladesh-geojson',
    "providerType" TEXT NOT NULL DEFAULT 'Local package/data',
    "cacheDurationMinutes" INTEGER NOT NULL DEFAULT 1440,
    "lastTestStatus" TEXT,
    "lastErrorMessage" TEXT,
    "lastSearchQuery" TEXT,
    "lastSearchResultCount" INTEGER NOT NULL DEFAULT 0,
    "lastTestAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "LocationDatasetSetting_singletonKey_key" ON "LocationDatasetSetting"("singletonKey");
