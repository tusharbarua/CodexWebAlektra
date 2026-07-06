-- CreateTable
CREATE TABLE "SparkleServiceRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "requestNumber" TEXT NOT NULL,
    "serviceType" TEXT NOT NULL,
    "moduleDetails" JSONB NOT NULL,
    "pvCapacityKwp" DECIMAL NOT NULL,
    "acCapacityKw" DECIMAL NOT NULL,
    "divisionId" TEXT,
    "divisionName" TEXT,
    "districtId" TEXT,
    "districtName" TEXT,
    "upazilaId" TEXT,
    "upazilaName" TEXT,
    "postOffice" TEXT,
    "postalCode" TEXT,
    "addressLine" TEXT NOT NULL,
    "manualAddressFallback" BOOLEAN NOT NULL DEFAULT false,
    "institutionName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "contactNumber" TEXT NOT NULL,
    "additionalNotes" TEXT,
    "internalNotes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "SparkleServiceRequest_requestNumber_key" ON "SparkleServiceRequest"("requestNumber");
