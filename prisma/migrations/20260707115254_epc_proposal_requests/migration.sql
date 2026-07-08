-- CreateTable
CREATE TABLE "EpcProposalRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "requestNumber" TEXT NOT NULL,
    "institutionName" TEXT NOT NULL,
    "contactPerson" TEXT NOT NULL,
    "contactNumber" TEXT NOT NULL,
    "email" TEXT,
    "address" TEXT NOT NULL,
    "facilityType" TEXT NOT NULL,
    "projectType" TEXT NOT NULL,
    "roofArea" TEXT,
    "monthlyBill" TEXT,
    "preferredCapacity" TEXT,
    "transformerInfo" TEXT,
    "additionalNotes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "internalNotes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "EpcProposalRequest_requestNumber_key" ON "EpcProposalRequest"("requestNumber");

-- CreateIndex
CREATE INDEX "EpcProposalRequest_status_createdAt_idx" ON "EpcProposalRequest"("status", "createdAt");
