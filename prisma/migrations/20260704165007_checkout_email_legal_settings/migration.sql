-- CreateTable
CREATE TABLE "EcommerceCheckoutSetting" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "singletonKey" TEXT NOT NULL DEFAULT 'default',
    "requireOtpVerification" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "PaymentInstructionSetting" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "singletonKey" TEXT NOT NULL DEFAULT 'default',
    "manualBankTransferEnabled" BOOLEAN NOT NULL DEFAULT true,
    "showBankInstructionInEmail" BOOLEAN NOT NULL DEFAULT true,
    "bankAccountName" TEXT NOT NULL DEFAULT 'ALEKTRA RENEWABLE',
    "bankName" TEXT NOT NULL DEFAULT 'Dutch Bangla Bank Ltd',
    "branchName" TEXT NOT NULL DEFAULT 'OR Nizam Road',
    "accountNumber" TEXT NOT NULL DEFAULT '1291100024117',
    "routingNumber" TEXT NOT NULL DEFAULT '090151480',
    "paymentInstructionText" TEXT NOT NULL DEFAULT 'After completing payment, please reply to this email with your deposit slip/payment receipt, or send it to our WhatsApp. Please write your order number clearly so that we can trace your payment quickly.',
    "paymentEmail" TEXT NOT NULL DEFAULT 'contact@alektraepc.com',
    "whatsappNumber" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ShopLegalContent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "policyKey" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "version" TEXT NOT NULL DEFAULT 'v1.0',
    "effectiveDate" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'PUBLISHED',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
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
    "customerMobileNumber" TEXT,
    "companyName" TEXT,
    "verifiedMobile" TEXT,
    "verifiedMobileNumber" TEXT,
    "otpRequiredAtCheckout" BOOLEAN NOT NULL DEFAULT false,
    "otpVerified" BOOLEAN NOT NULL DEFAULT false,
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
    "emailSentAt" DATETIME,
    "emailLastError" TEXT,
    "paymentInstructionSent" BOOLEAN NOT NULL DEFAULT false,
    "termsAccepted" BOOLEAN NOT NULL DEFAULT false,
    "termsAcceptedAt" DATETIME,
    "termsVersion" TEXT,
    "refundPolicyVersion" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Order_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES "Coupon" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Order" ("billingAddress", "companyName", "couponId", "createdAt", "customerEmail", "customerName", "customerPhone", "deliveryBdt", "deliveryLabel", "deliveryMethod", "deliveryNotes", "discountBdt", "emailStatus", "id", "notes", "orderNumber", "paymentMethod", "paymentStatus", "shippingAddress", "smsStatus", "status", "subtotalBdt", "totalBdt", "updatedAt", "userId", "verifiedMobile") SELECT "billingAddress", "companyName", "couponId", "createdAt", "customerEmail", "customerName", "customerPhone", "deliveryBdt", "deliveryLabel", "deliveryMethod", "deliveryNotes", "discountBdt", "emailStatus", "id", "notes", "orderNumber", "paymentMethod", "paymentStatus", "shippingAddress", "smsStatus", "status", "subtotalBdt", "totalBdt", "updatedAt", "userId", "verifiedMobile" FROM "Order";
DROP TABLE "Order";
ALTER TABLE "new_Order" RENAME TO "Order";
CREATE UNIQUE INDEX "Order_orderNumber_key" ON "Order"("orderNumber");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "EcommerceCheckoutSetting_singletonKey_key" ON "EcommerceCheckoutSetting"("singletonKey");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentInstructionSetting_singletonKey_key" ON "PaymentInstructionSetting"("singletonKey");

-- CreateIndex
CREATE UNIQUE INDEX "ShopLegalContent_policyKey_key" ON "ShopLegalContent"("policyKey");

-- CreateIndex
CREATE UNIQUE INDEX "ShopLegalContent_slug_key" ON "ShopLegalContent"("slug");
