-- CreateTable
CREATE TABLE "EcommerceDeliverySetting" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "singletonKey" TEXT NOT NULL DEFAULT 'default',
    "courierEnabled" BOOLEAN NOT NULL DEFAULT true,
    "courierMinimumChargeBdt" DECIMAL NOT NULL DEFAULT 200,
    "pickupEnabled" BOOLEAN NOT NULL DEFAULT true,
    "pickupLabel" TEXT NOT NULL DEFAULT 'Pick up from our warehouse',
    "pickupAddress" TEXT NOT NULL DEFAULT 'Khulshi, Chattogram',
    "pickupChargeBdt" DECIMAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "MessagingIntegration" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "singletonKey" TEXT NOT NULL DEFAULT 'default',
    "providerName" TEXT NOT NULL DEFAULT 'Not configured',
    "baseUrl" TEXT,
    "apiKey" TEXT,
    "senderId" TEXT,
    "otpTemplate" TEXT NOT NULL DEFAULT 'Your Alektra Renewable OTP is [OTP]. It expires in 5 minutes.',
    "orderConfirmationTemplate" TEXT NOT NULL DEFAULT 'Your Alektra Renewable order #[ORDER_NUMBER] has been received. Total: BDT [TOTAL]. We will contact you shortly.',
    "isEnabled" BOOLEAN NOT NULL DEFAULT false,
    "lastTestStatus" TEXT,
    "lastTestAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "OtpVerification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "mobile" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "purpose" TEXT NOT NULL DEFAULT 'checkout',
    "expiresAt" DATETIME NOT NULL,
    "verifiedAt" DATETIME,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "resendCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "NotificationLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderId" TEXT,
    "channel" TEXT NOT NULL,
    "recipient" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "provider" TEXT,
    "response" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "NotificationLog_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Order" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderNumber" TEXT NOT NULL,
    "userId" TEXT,
    "customerName" TEXT NOT NULL,
    "customerEmail" TEXT,
    "customerPhone" TEXT NOT NULL,
    "companyName" TEXT,
    "verifiedMobile" TEXT,
    "billingAddress" JSONB NOT NULL,
    "shippingAddress" JSONB NOT NULL,
    "deliveryMethod" TEXT NOT NULL DEFAULT 'COURIER',
    "deliveryLabel" TEXT,
    "deliveryNotes" TEXT,
    "subtotalBdt" DECIMAL NOT NULL,
    "discountBdt" DECIMAL NOT NULL DEFAULT 0,
    "deliveryBdt" DECIMAL NOT NULL DEFAULT 0,
    "totalBdt" DECIMAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "paymentMethod" TEXT NOT NULL,
    "paymentStatus" TEXT NOT NULL DEFAULT 'UNPAID',
    "couponId" TEXT,
    "notes" TEXT,
    "smsStatus" TEXT NOT NULL DEFAULT 'NOT_CONFIGURED',
    "emailStatus" TEXT NOT NULL DEFAULT 'NOT_CONFIGURED',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Order_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES "Coupon" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Order" ("billingAddress", "couponId", "createdAt", "customerEmail", "customerName", "customerPhone", "deliveryBdt", "discountBdt", "id", "notes", "orderNumber", "paymentMethod", "paymentStatus", "shippingAddress", "status", "subtotalBdt", "totalBdt", "updatedAt", "userId") SELECT "billingAddress", "couponId", "createdAt", "customerEmail", "customerName", "customerPhone", "deliveryBdt", "discountBdt", "id", "notes", "orderNumber", "paymentMethod", "paymentStatus", "shippingAddress", "status", "subtotalBdt", "totalBdt", "updatedAt", "userId" FROM "Order";
DROP TABLE "Order";
ALTER TABLE "new_Order" RENAME TO "Order";
CREATE UNIQUE INDEX "Order_orderNumber_key" ON "Order"("orderNumber");
CREATE TABLE "new_ProductCategory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'PUBLISHED',
    "parentId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ProductCategory_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "ProductCategory" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_ProductCategory" ("createdAt", "description", "id", "name", "parentId", "slug", "updatedAt") SELECT "createdAt", "description", "id", "name", "parentId", "slug", "updatedAt" FROM "ProductCategory";
DROP TABLE "ProductCategory";
ALTER TABLE "new_ProductCategory" RENAME TO "ProductCategory";
CREATE UNIQUE INDEX "ProductCategory_slug_key" ON "ProductCategory"("slug");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "EcommerceDeliverySetting_singletonKey_key" ON "EcommerceDeliverySetting"("singletonKey");

-- CreateIndex
CREATE UNIQUE INDEX "MessagingIntegration_singletonKey_key" ON "MessagingIntegration"("singletonKey");

-- CreateIndex
CREATE INDEX "OtpVerification_mobile_purpose_expiresAt_idx" ON "OtpVerification"("mobile", "purpose", "expiresAt");
