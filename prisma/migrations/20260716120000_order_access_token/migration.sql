ALTER TABLE "Order" ADD COLUMN "accessToken" TEXT;

CREATE UNIQUE INDEX "Order_accessToken_key" ON "Order"("accessToken");
