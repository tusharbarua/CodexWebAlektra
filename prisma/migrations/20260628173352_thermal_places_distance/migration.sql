-- CreateTable
CREATE TABLE "ThermalBaseLocation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "singletonKey" TEXT NOT NULL DEFAULT 'default',
    "name" TEXT NOT NULL DEFAULT 'Alektra Renewable Base',
    "address" TEXT,
    "googlePlaceId" TEXT,
    "latitude" DECIMAL NOT NULL DEFAULT 22.3585575,
    "longitude" DECIMAL NOT NULL DEFAULT 91.8196934,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ThermalInspectionRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "requestNumber" TEXT NOT NULL,
    "inspectionType" TEXT NOT NULL,
    "moduleDetails" JSONB NOT NULL,
    "pvCapacityKwp" DECIMAL NOT NULL,
    "acCapacityKw" DECIMAL NOT NULL,
    "projectLocation" TEXT NOT NULL,
    "projectLocationName" TEXT,
    "projectFormattedAddress" TEXT,
    "googlePlaceId" TEXT,
    "latitude" DECIMAL,
    "longitude" DECIMAL,
    "manualAddressFallback" TEXT,
    "distanceFromBaseKm" DECIMAL,
    "distanceCalculationStatus" TEXT NOT NULL DEFAULT 'missing_project_coordinates',
    "institutionName" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "contactNumber" TEXT NOT NULL,
    "additionalNotes" TEXT,
    "internalNotes" TEXT,
    "askForPayment" BOOLEAN NOT NULL DEFAULT false,
    "calculatedFeeBdt" DECIMAL,
    "paymentStatus" TEXT NOT NULL DEFAULT 'UNPAID',
    "sslTransactionId" TEXT,
    "pdfFilePath" TEXT,
    "emailSentAt" DATETIME,
    "adminEmailSentAt" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_ThermalInspectionRequest" ("acCapacityKw", "additionalNotes", "address", "adminEmailSentAt", "askForPayment", "calculatedFeeBdt", "contactNumber", "createdAt", "email", "emailSentAt", "id", "inspectionType", "institutionName", "internalNotes", "latitude", "longitude", "moduleDetails", "paymentStatus", "pdfFilePath", "projectLocation", "pvCapacityKwp", "requestNumber", "sslTransactionId", "status", "updatedAt") SELECT "acCapacityKw", "additionalNotes", "address", "adminEmailSentAt", "askForPayment", "calculatedFeeBdt", "contactNumber", "createdAt", "email", "emailSentAt", "id", "inspectionType", "institutionName", "internalNotes", "latitude", "longitude", "moduleDetails", "paymentStatus", "pdfFilePath", "projectLocation", "pvCapacityKwp", "requestNumber", "sslTransactionId", "status", "updatedAt" FROM "ThermalInspectionRequest";
DROP TABLE "ThermalInspectionRequest";
ALTER TABLE "new_ThermalInspectionRequest" RENAME TO "ThermalInspectionRequest";
CREATE UNIQUE INDEX "ThermalInspectionRequest_requestNumber_key" ON "ThermalInspectionRequest"("requestNumber");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "ThermalBaseLocation_singletonKey_key" ON "ThermalBaseLocation"("singletonKey");
