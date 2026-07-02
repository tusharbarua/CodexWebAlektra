-- CreateTable
CREATE TABLE "LocationApiSetting" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "singletonKey" TEXT NOT NULL DEFAULT 'default',
    "providerName" TEXT NOT NULL DEFAULT 'BD APIs',
    "baseUrl" TEXT,
    "sourceUrl" TEXT NOT NULL DEFAULT 'https://github.com/ifahimreza/bangladesh-geojson.git',
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "cacheDurationMinutes" INTEGER NOT NULL DEFAULT 1440,
    "lastTestStatus" TEXT,
    "lastErrorMessage" TEXT,
    "lastTestAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "LocationApiSetting_singletonKey_key" ON "LocationApiSetting"("singletonKey");
