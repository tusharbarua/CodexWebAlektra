-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'EDITOR', 'SHOP_MANAGER', 'CUSTOMER');

-- CreateEnum
CREATE TYPE "PublishStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'UNPUBLISHED');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'NEW', 'CONFIRMED', 'PROCESSING', 'BOOKED_FOR_SHIPPING', 'HANDED_TO_COURIER', 'PRODUCT_RECEIVED', 'PAYMENT_CLEARED', 'READY_FOR_PICKUP', 'SHIPPED', 'DELIVERED', 'COMPLETED', 'CANCELLED', 'REFUNDED', 'RETURNED_ISSUE');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('SSLCOMMERZ', 'CASH_ON_DELIVERY');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('UNPAID', 'CASH_ON_DELIVERY', 'PENDING', 'INITIATED', 'PAID', 'PAYMENT_CLEARED', 'FAILED', 'CANCELLED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "IntegrationProvider" AS ENUM ('SOLISCLOUD', 'SUNGROW_ISOLARCLOUD', 'SMA_SUNNY_PORTAL', 'GENERIC');

-- CreateEnum
CREATE TYPE "ThermalInspectionType" AS ENUM ('STANDARD', 'COMPREHENSIVE');

-- CreateEnum
CREATE TYPE "ThermalRequestStatus" AS ENUM ('NEW', 'REVIEWED', 'QUOTED', 'AWAITING_PAYMENT', 'PAID', 'SCHEDULED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "SparkleServiceType" AS ENUM ('ROUTINE_CLEANING', 'ONE_TIME_DEEP_CLEANING', 'SCHEDULED_MAINTENANCE_CLEANING', 'INSPECTION_CLEANING_COORDINATION');

-- CreateEnum
CREATE TYPE "SparkleRequestStatus" AS ENUM ('NEW', 'REVIEWED', 'QUOTED', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PageKey" AS ENUM ('epc', 'thermal', 'sparkle', 'mapping');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "passwordHash" TEXT,
    "role" "Role" NOT NULL DEFAULT 'CUSTOMER',
    "appRoleId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppRole" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppRolePermission" (
    "id" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AppRolePermission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "emailVerifiedAt" TIMESTAMP(3),
    "mobileNumber" TEXT,
    "passwordHash" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerEmailVerificationToken" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CustomerEmailVerificationToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerPasswordResetToken" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CustomerPasswordResetToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerAddress" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "recipientName" TEXT NOT NULL,
    "mobileNumber" TEXT NOT NULL,
    "divisionId" TEXT,
    "divisionName" TEXT NOT NULL,
    "districtId" TEXT,
    "districtName" TEXT NOT NULL,
    "upazilaId" TEXT,
    "upazilaName" TEXT NOT NULL,
    "addressLine" TEXT NOT NULL,
    "postalCode" TEXT,
    "deliveryNotes" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerAddress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SeoMetadata" (
    "id" TEXT NOT NULL,
    "route" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "keywords" JSONB NOT NULL,
    "ogImage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SeoMetadata_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SiteContent" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "status" "PublishStatus" NOT NULL DEFAULT 'PUBLISHED',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteContent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Page" (
    "id" TEXT NOT NULL,
    "pageKey" "PageKey" NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "metaTitle" TEXT,
    "metaDescription" TEXT,
    "status" "PublishStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Page_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PageSection" (
    "id" TEXT NOT NULL,
    "pageId" TEXT NOT NULL,
    "sectionKey" TEXT NOT NULL,
    "sectionType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "body" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "settingsJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PageSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PageSectionItem" (
    "id" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "body" TEXT,
    "icon" TEXT,
    "imagePath" TEXT,
    "videoPath" TEXT,
    "linkText" TEXT,
    "linkUrl" TEXT,
    "badge" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "settingsJson" JSONB,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PageSectionItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SiteSettings" (
    "id" TEXT NOT NULL,
    "singletonKey" TEXT NOT NULL DEFAULT 'footer',
    "contactEmail" TEXT NOT NULL DEFAULT 'contact@alektraepc.com',
    "contactPhone" TEXT NOT NULL DEFAULT '+880 1735 954 844',
    "secondaryPhone" TEXT,
    "address" TEXT NOT NULL DEFAULT 'Chattogram | Dhaka | Bangladesh',
    "facebookUrl" TEXT,
    "linkedinUrl" TEXT,
    "youtubeUrl" TEXT,
    "whatsappNumber" TEXT,
    "footerDescription" TEXT NOT NULL DEFAULT 'Solar EPC, thermal inspection, cleaning and mapping for renewable-energy assets in Bangladesh.',
    "copyrightText" TEXT NOT NULL DEFAULT 'Copyright (c) Alektra Renewable. All rights reserved.',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HeroMedia" (
    "id" TEXT NOT NULL,
    "pageKey" "PageKey" NOT NULL DEFAULT 'epc',
    "title" TEXT NOT NULL,
    "mediaType" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "filePath" TEXT,
    "posterImagePath" TEXT,
    "alt" TEXT NOT NULL,
    "altText" TEXT,
    "mimeType" TEXT,
    "fileSize" INTEGER,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "status" "PublishStatus" NOT NULL DEFAULT 'PUBLISHED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HeroMedia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "clientName" TEXT,
    "location" TEXT NOT NULL,
    "projectType" TEXT NOT NULL,
    "capacityKw" DECIMAL(65,30) NOT NULL,
    "commissionedAt" TIMESTAMP(3),
    "coverImage" TEXT,
    "summary" TEXT NOT NULL,
    "fullCaseStudy" TEXT NOT NULL DEFAULT '',
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "featureOnResources" BOOLEAN NOT NULL DEFAULT false,
    "inverterBrandModel" TEXT,
    "moduleBrandModel" TEXT,
    "imageUrls" JSONB,
    "videoUrl" TEXT,
    "annualGeneration" DECIMAL(65,30),
    "annualSavingsBdt" DECIMAL(65,30),
    "status" "PublishStatus" NOT NULL DEFAULT 'PUBLISHED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectImage" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "imagePath" TEXT NOT NULL,
    "altText" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImpactSnapshot" (
    "id" TEXT NOT NULL,
    "plantsInOperation" INTEGER NOT NULL,
    "totalInstalledCapacityKw" DECIMAL(65,30) NOT NULL,
    "kwhGenerated" DECIMAL(65,30) NOT NULL,
    "equivalentTreesPlanted" DECIMAL(65,30) NOT NULL,
    "co2OffsetTons" DECIMAL(65,30) NOT NULL,
    "longHaulFlightsAvoided" DECIMAL(65,30) NOT NULL,
    "manualBaselineJson" JSONB NOT NULL,
    "lastCalculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ImpactSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImpactDailyLedger" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "provider" "IntegrationProvider",
    "externalPlantId" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "kwhGenerated" DECIMAL(65,30) NOT NULL,
    "co2OffsetTons" DECIMAL(65,30) NOT NULL,
    "treesEquivalent" DECIMAL(65,30) NOT NULL,
    "flightsAvoided" DECIMAL(65,30) NOT NULL,
    "rawPayload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ImpactDailyLedger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MonitoringIntegration" (
    "id" TEXT NOT NULL,
    "provider" "IntegrationProvider" NOT NULL,
    "label" TEXT NOT NULL,
    "baseUrl" TEXT,
    "apiKey" TEXT,
    "apiSecret" TEXT,
    "username" TEXT,
    "password" TEXT,
    "plantMapping" TEXT,
    "syncFrequencyMinutes" INTEGER NOT NULL DEFAULT 1440,
    "isEnabled" BOOLEAN NOT NULL DEFAULT false,
    "lastSyncAt" TIMESTAMP(3),
    "lastSyncStatus" TEXT,
    "lastSyncMessage" TEXT,
    "errorLog" TEXT,
    "settings" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MonitoringIntegration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResourceCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "icon" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "status" "PublishStatus" NOT NULL DEFAULT 'PUBLISHED',

    CONSTRAINT "ResourceCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResourceArticle" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "excerpt" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "coverImage" TEXT,
    "coverImageAlt" TEXT,
    "status" "PublishStatus" NOT NULL DEFAULT 'DRAFT',
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "readTimeMinutes" INTEGER,
    "categoryId" TEXT NOT NULL,
    "authorId" TEXT,
    "publishedAt" TIMESTAMP(3),
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "sourceType" TEXT,
    "sourceProjectId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResourceArticle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "status" "PublishStatus" NOT NULL DEFAULT 'PUBLISHED',
    "parentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "priceBdt" DECIMAL(65,30) NOT NULL,
    "compareAtPriceBdt" DECIMAL(65,30),
    "stockQuantity" INTEGER NOT NULL,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "status" "PublishStatus" NOT NULL DEFAULT 'DRAFT',
    "shortDescription" TEXT NOT NULL,
    "technicalDescription" TEXT NOT NULL,
    "keyFeatures" JSONB,
    "warrantyNote" TEXT,
    "supportNote" TEXT,
    "datasheetUrl" TEXT,
    "manualUrl" TEXT,
    "specifications" JSONB NOT NULL,
    "categoryId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductImage" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "imagePath" TEXT NOT NULL,
    "altText" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Coupon" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "discountType" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "minimumSpend" DECIMAL(65,30),
    "startsAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "usageLimit" INTEGER,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Coupon_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeliveryCharge" (
    "id" TEXT NOT NULL,
    "zone" TEXT NOT NULL,
    "description" TEXT,
    "chargeBdt" DECIMAL(65,30) NOT NULL,
    "freeAboveBdt" DECIMAL(65,30),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeliveryCharge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EcommerceDeliverySetting" (
    "id" TEXT NOT NULL,
    "singletonKey" TEXT NOT NULL DEFAULT 'default',
    "courierEnabled" BOOLEAN NOT NULL DEFAULT true,
    "courierMinimumChargeBdt" DECIMAL(65,30) NOT NULL DEFAULT 200,
    "pickupEnabled" BOOLEAN NOT NULL DEFAULT true,
    "pickupLabel" TEXT NOT NULL DEFAULT 'Pick up from our warehouse',
    "pickupAddress" TEXT NOT NULL DEFAULT 'Khulshi, Chattogram',
    "pickupChargeBdt" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EcommerceDeliverySetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EcommerceCheckoutSetting" (
    "id" TEXT NOT NULL,
    "singletonKey" TEXT NOT NULL DEFAULT 'default',
    "requireOtpVerification" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EcommerceCheckoutSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentInstructionSetting" (
    "id" TEXT NOT NULL,
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
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentInstructionSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShopLegalContent" (
    "id" TEXT NOT NULL,
    "policyKey" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "version" TEXT NOT NULL DEFAULT 'v1.0',
    "effectiveDate" TIMESTAMP(3),
    "status" "PublishStatus" NOT NULL DEFAULT 'PUBLISHED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShopLegalContent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LegalDocument" (
    "id" TEXT NOT NULL,
    "documentKey" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "version" TEXT NOT NULL DEFAULT 'v1.0',
    "effectiveDate" TIMESTAMP(3),
    "status" "PublishStatus" NOT NULL DEFAULT 'PUBLISHED',
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LegalDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MessagingIntegration" (
    "id" TEXT NOT NULL,
    "singletonKey" TEXT NOT NULL DEFAULT 'default',
    "providerName" TEXT NOT NULL DEFAULT 'Not configured',
    "baseUrl" TEXT,
    "apiKey" TEXT,
    "senderId" TEXT,
    "otpTemplate" TEXT NOT NULL DEFAULT 'Your Alektra Renewable OTP is [OTP]. It expires in 5 minutes.',
    "orderConfirmationTemplate" TEXT NOT NULL DEFAULT 'Your Alektra Renewable order #[ORDER_NUMBER] has been received. Total: BDT [TOTAL]. We will contact you shortly.',
    "isEnabled" BOOLEAN NOT NULL DEFAULT false,
    "lastTestStatus" TEXT,
    "lastTestAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MessagingIntegration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LocationDatasetSetting" (
    "id" TEXT NOT NULL,
    "singletonKey" TEXT NOT NULL DEFAULT 'default',
    "providerName" TEXT NOT NULL DEFAULT 'bangladesh-geojson',
    "providerType" TEXT NOT NULL DEFAULT 'Local package/data',
    "cacheDurationMinutes" INTEGER NOT NULL DEFAULT 1440,
    "lastTestStatus" TEXT,
    "lastErrorMessage" TEXT,
    "lastSearchQuery" TEXT,
    "lastSearchResultCount" INTEGER NOT NULL DEFAULT 0,
    "lastTestAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LocationDatasetSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OtpVerification" (
    "id" TEXT NOT NULL,
    "mobile" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "purpose" TEXT NOT NULL DEFAULT 'checkout',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "verifiedAt" TIMESTAMP(3),
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "resendCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OtpVerification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationLog" (
    "id" TEXT NOT NULL,
    "orderId" TEXT,
    "channel" TEXT NOT NULL,
    "recipient" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "provider" TEXT,
    "response" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NotificationLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "userId" TEXT,
    "customerId" TEXT,
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
    "subtotalBdt" DECIMAL(65,30) NOT NULL,
    "discountBdt" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "deliveryBdt" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "totalBdt" DECIMAL(65,30) NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "paymentMethod" "PaymentMethod" NOT NULL,
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'UNPAID',
    "couponId" TEXT,
    "notes" TEXT,
    "smsStatus" TEXT NOT NULL DEFAULT 'NOT_CONFIGURED',
    "emailStatus" TEXT NOT NULL DEFAULT 'NOT_CONFIGURED',
    "emailSentAt" TIMESTAMP(3),
    "emailLastError" TEXT,
    "paymentInstructionSent" BOOLEAN NOT NULL DEFAULT false,
    "termsAccepted" BOOLEAN NOT NULL DEFAULT false,
    "termsAcceptedAt" TIMESTAMP(3),
    "termsVersion" TEXT,
    "refundPolicyVersion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderStatusHistory" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "fromStatus" "OrderStatus",
    "toStatus" "OrderStatus" NOT NULL,
    "paymentStatus" "PaymentStatus",
    "note" TEXT,
    "changedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderStatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderItem" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPriceBdt" DECIMAL(65,30) NOT NULL,
    "lineTotalBdt" DECIMAL(65,30) NOT NULL,

    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentTransaction" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "transactionId" TEXT,
    "validationId" TEXT,
    "amountBdt" DECIMAL(65,30) NOT NULL,
    "status" "PaymentStatus" NOT NULL,
    "requestPayload" JSONB,
    "responsePayload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContactSubmission" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "company" TEXT,
    "interest" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContactSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ThermalInspectionRequest" (
    "id" TEXT NOT NULL,
    "requestNumber" TEXT NOT NULL,
    "inspectionType" "ThermalInspectionType" NOT NULL,
    "moduleDetails" JSONB NOT NULL,
    "pvCapacityKwp" DECIMAL(65,30) NOT NULL,
    "acCapacityKw" DECIMAL(65,30) NOT NULL,
    "projectLocation" TEXT NOT NULL,
    "projectLocationName" TEXT,
    "projectFormattedAddress" TEXT,
    "googlePlaceId" TEXT,
    "latitude" DECIMAL(65,30),
    "longitude" DECIMAL(65,30),
    "manualAddressFallback" TEXT,
    "distanceFromBaseKm" DECIMAL(65,30),
    "distanceCalculationStatus" TEXT NOT NULL DEFAULT 'missing_project_coordinates',
    "institutionName" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "contactNumber" TEXT NOT NULL,
    "additionalNotes" TEXT,
    "internalNotes" TEXT,
    "askForPayment" BOOLEAN NOT NULL DEFAULT false,
    "calculatedFeeBdt" DECIMAL(65,30),
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'UNPAID',
    "sslTransactionId" TEXT,
    "pdfFilePath" TEXT,
    "emailSentAt" TIMESTAMP(3),
    "adminEmailSentAt" TIMESTAMP(3),
    "status" "ThermalRequestStatus" NOT NULL DEFAULT 'NEW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ThermalInspectionRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SparkleServiceRequest" (
    "id" TEXT NOT NULL,
    "requestNumber" TEXT NOT NULL,
    "serviceType" "SparkleServiceType" NOT NULL,
    "moduleDetails" JSONB NOT NULL,
    "pvCapacityKwp" DECIMAL(65,30) NOT NULL,
    "acCapacityKw" DECIMAL(65,30) NOT NULL,
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
    "status" "SparkleRequestStatus" NOT NULL DEFAULT 'NEW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SparkleServiceRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MappingServiceRequest" (
    "id" TEXT NOT NULL,
    "requestNumber" TEXT NOT NULL,
    "serviceType" TEXT NOT NULL,
    "projectSiteType" TEXT NOT NULL,
    "projectSize" TEXT NOT NULL,
    "preferredMethod" TEXT NOT NULL,
    "requiredDeliverables" JSONB NOT NULL,
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
    "contactPerson" TEXT NOT NULL,
    "email" TEXT,
    "contactNumber" TEXT NOT NULL,
    "additionalNotes" TEXT,
    "internalNotes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MappingServiceRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EpcProposalRequest" (
    "id" TEXT NOT NULL,
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
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EpcProposalRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ThermalBaseLocation" (
    "id" TEXT NOT NULL,
    "singletonKey" TEXT NOT NULL DEFAULT 'default',
    "name" TEXT NOT NULL DEFAULT 'Alektra Renewable Base',
    "address" TEXT,
    "googlePlaceId" TEXT,
    "latitude" DECIMAL(65,30) NOT NULL DEFAULT 22.3585575,
    "longitude" DECIMAL(65,30) NOT NULL DEFAULT 91.8196934,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ThermalBaseLocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ThermalPricingRule" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "baseInspectionFeeBdt" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "ratePerKwpBdt" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "distanceChargePerKmBdt" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "minimumInspectionFeeBdt" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "standardMultiplier" DECIMAL(65,30) NOT NULL DEFAULT 1,
    "comprehensiveMultiplier" DECIMAL(65,30) NOT NULL DEFAULT 1.5,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ThermalPricingRule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "AppRole_name_key" ON "AppRole"("name");

-- CreateIndex
CREATE UNIQUE INDEX "AppRolePermission_roleId_module_action_key" ON "AppRolePermission"("roleId", "module", "action");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_email_key" ON "Customer"("email");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerEmailVerificationToken_tokenHash_key" ON "CustomerEmailVerificationToken"("tokenHash");

-- CreateIndex
CREATE INDEX "CustomerEmailVerificationToken_customerId_expiresAt_idx" ON "CustomerEmailVerificationToken"("customerId", "expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerPasswordResetToken_tokenHash_key" ON "CustomerPasswordResetToken"("tokenHash");

-- CreateIndex
CREATE INDEX "CustomerPasswordResetToken_customerId_expiresAt_idx" ON "CustomerPasswordResetToken"("customerId", "expiresAt");

-- CreateIndex
CREATE INDEX "CustomerAddress_customerId_isDefault_idx" ON "CustomerAddress"("customerId", "isDefault");

-- CreateIndex
CREATE UNIQUE INDEX "SeoMetadata_route_key" ON "SeoMetadata"("route");

-- CreateIndex
CREATE UNIQUE INDEX "SiteContent_key_key" ON "SiteContent"("key");

-- CreateIndex
CREATE UNIQUE INDEX "Page_pageKey_key" ON "Page"("pageKey");

-- CreateIndex
CREATE UNIQUE INDEX "Page_slug_key" ON "Page"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "PageSection_pageId_sectionKey_key" ON "PageSection"("pageId", "sectionKey");

-- CreateIndex
CREATE UNIQUE INDEX "SiteSettings_singletonKey_key" ON "SiteSettings"("singletonKey");

-- CreateIndex
CREATE INDEX "HeroMedia_pageKey_isPublished_isPrimary_sortOrder_idx" ON "HeroMedia"("pageKey", "isPublished", "isPrimary", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "Project_slug_key" ON "Project"("slug");

-- CreateIndex
CREATE INDEX "Project_status_isFeatured_idx" ON "Project"("status", "isFeatured");

-- CreateIndex
CREATE INDEX "Project_status_isFeatured_commissionedAt_createdAt_idx" ON "Project"("status", "isFeatured", "commissionedAt", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ImpactDailyLedger_source_externalPlantId_date_key" ON "ImpactDailyLedger"("source", "externalPlantId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "ResourceCategory_slug_key" ON "ResourceCategory"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "ResourceArticle_slug_key" ON "ResourceArticle"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "ResourceArticle_sourceProjectId_key" ON "ResourceArticle"("sourceProjectId");

-- CreateIndex
CREATE INDEX "ResourceArticle_categoryId_status_idx" ON "ResourceArticle"("categoryId", "status");

-- CreateIndex
CREATE INDEX "ResourceArticle_status_isFeatured_publishedAt_idx" ON "ResourceArticle"("status", "isFeatured", "publishedAt");

-- CreateIndex
CREATE INDEX "ResourceArticle_sourceType_idx" ON "ResourceArticle"("sourceType");

-- CreateIndex
CREATE UNIQUE INDEX "ProductCategory_slug_key" ON "ProductCategory"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Product_slug_key" ON "Product"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Product_sku_key" ON "Product"("sku");

-- CreateIndex
CREATE INDEX "Product_categoryId_status_idx" ON "Product"("categoryId", "status");

-- CreateIndex
CREATE INDEX "Product_status_isFeatured_idx" ON "Product"("status", "isFeatured");

-- CreateIndex
CREATE INDEX "Product_createdAt_idx" ON "Product"("createdAt");

-- CreateIndex
CREATE INDEX "ProductImage_productId_isPrimary_sortOrder_idx" ON "ProductImage"("productId", "isPrimary", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "Coupon_code_key" ON "Coupon"("code");

-- CreateIndex
CREATE UNIQUE INDEX "DeliveryCharge_zone_key" ON "DeliveryCharge"("zone");

-- CreateIndex
CREATE UNIQUE INDEX "EcommerceDeliverySetting_singletonKey_key" ON "EcommerceDeliverySetting"("singletonKey");

-- CreateIndex
CREATE UNIQUE INDEX "EcommerceCheckoutSetting_singletonKey_key" ON "EcommerceCheckoutSetting"("singletonKey");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentInstructionSetting_singletonKey_key" ON "PaymentInstructionSetting"("singletonKey");

-- CreateIndex
CREATE UNIQUE INDEX "ShopLegalContent_policyKey_key" ON "ShopLegalContent"("policyKey");

-- CreateIndex
CREATE UNIQUE INDEX "ShopLegalContent_slug_key" ON "ShopLegalContent"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "LegalDocument_documentKey_key" ON "LegalDocument"("documentKey");

-- CreateIndex
CREATE UNIQUE INDEX "LegalDocument_slug_key" ON "LegalDocument"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "MessagingIntegration_singletonKey_key" ON "MessagingIntegration"("singletonKey");

-- CreateIndex
CREATE UNIQUE INDEX "LocationDatasetSetting_singletonKey_key" ON "LocationDatasetSetting"("singletonKey");

-- CreateIndex
CREATE INDEX "OtpVerification_mobile_purpose_expiresAt_idx" ON "OtpVerification"("mobile", "purpose", "expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "Order_orderNumber_key" ON "Order"("orderNumber");

-- CreateIndex
CREATE INDEX "Order_customerId_idx" ON "Order"("customerId");

-- CreateIndex
CREATE INDEX "Order_customerEmail_idx" ON "Order"("customerEmail");

-- CreateIndex
CREATE INDEX "Order_createdAt_idx" ON "Order"("createdAt");

-- CreateIndex
CREATE INDEX "Order_status_createdAt_idx" ON "Order"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Order_paymentStatus_createdAt_idx" ON "Order"("paymentStatus", "createdAt");

-- CreateIndex
CREATE INDEX "OrderStatusHistory_orderId_createdAt_idx" ON "OrderStatusHistory"("orderId", "createdAt");

-- CreateIndex
CREATE INDEX "OrderItem_orderId_idx" ON "OrderItem"("orderId");

-- CreateIndex
CREATE INDEX "OrderItem_productId_idx" ON "OrderItem"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentTransaction_transactionId_key" ON "PaymentTransaction"("transactionId");

-- CreateIndex
CREATE UNIQUE INDEX "ThermalInspectionRequest_requestNumber_key" ON "ThermalInspectionRequest"("requestNumber");

-- CreateIndex
CREATE UNIQUE INDEX "SparkleServiceRequest_requestNumber_key" ON "SparkleServiceRequest"("requestNumber");

-- CreateIndex
CREATE UNIQUE INDEX "MappingServiceRequest_requestNumber_key" ON "MappingServiceRequest"("requestNumber");

-- CreateIndex
CREATE UNIQUE INDEX "EpcProposalRequest_requestNumber_key" ON "EpcProposalRequest"("requestNumber");

-- CreateIndex
CREATE INDEX "EpcProposalRequest_status_createdAt_idx" ON "EpcProposalRequest"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ThermalBaseLocation_singletonKey_key" ON "ThermalBaseLocation"("singletonKey");

-- CreateIndex
CREATE UNIQUE INDEX "ThermalPricingRule_name_key" ON "ThermalPricingRule"("name");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_appRoleId_fkey" FOREIGN KEY ("appRoleId") REFERENCES "AppRole"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppRolePermission" ADD CONSTRAINT "AppRolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "AppRole"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerEmailVerificationToken" ADD CONSTRAINT "CustomerEmailVerificationToken_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerPasswordResetToken" ADD CONSTRAINT "CustomerPasswordResetToken_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerAddress" ADD CONSTRAINT "CustomerAddress_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PageSection" ADD CONSTRAINT "PageSection_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "Page"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PageSectionItem" ADD CONSTRAINT "PageSectionItem_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "PageSection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectImage" ADD CONSTRAINT "ProjectImage_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResourceArticle" ADD CONSTRAINT "ResourceArticle_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ResourceCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResourceArticle" ADD CONSTRAINT "ResourceArticle_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductCategory" ADD CONSTRAINT "ProductCategory_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "ProductCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ProductCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductImage" ADD CONSTRAINT "ProductImage_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationLog" ADD CONSTRAINT "NotificationLog_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES "Coupon"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderStatusHistory" ADD CONSTRAINT "OrderStatusHistory_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderStatusHistory" ADD CONSTRAINT "OrderStatusHistory_changedByUserId_fkey" FOREIGN KEY ("changedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentTransaction" ADD CONSTRAINT "PaymentTransaction_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
