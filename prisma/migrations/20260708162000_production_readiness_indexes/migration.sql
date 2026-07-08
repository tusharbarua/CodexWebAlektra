-- Production lookup indexes for shop, account order history, admin order filtering, and resource listings.
CREATE INDEX "ResourceArticle_categoryId_status_idx" ON "ResourceArticle"("categoryId", "status");
CREATE INDEX "ResourceArticle_status_isFeatured_publishedAt_idx" ON "ResourceArticle"("status", "isFeatured", "publishedAt");

CREATE INDEX "Product_categoryId_status_idx" ON "Product"("categoryId", "status");
CREATE INDEX "Product_status_isFeatured_idx" ON "Product"("status", "isFeatured");
CREATE INDEX "Product_createdAt_idx" ON "Product"("createdAt");

CREATE INDEX "ProductImage_productId_isPrimary_sortOrder_idx" ON "ProductImage"("productId", "isPrimary", "sortOrder");

CREATE INDEX "Order_customerEmail_idx" ON "Order"("customerEmail");
CREATE INDEX "Order_createdAt_idx" ON "Order"("createdAt");
CREATE INDEX "Order_status_createdAt_idx" ON "Order"("status", "createdAt");
CREATE INDEX "Order_paymentStatus_createdAt_idx" ON "Order"("paymentStatus", "createdAt");

CREATE INDEX "OrderItem_orderId_idx" ON "OrderItem"("orderId");
CREATE INDEX "OrderItem_productId_idx" ON "OrderItem"("productId");
