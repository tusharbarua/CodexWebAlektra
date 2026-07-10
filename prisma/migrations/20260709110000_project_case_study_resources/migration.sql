ALTER TABLE "Project" ADD COLUMN "isFeatured" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Project" ADD COLUMN "featureOnResources" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "ResourceArticle" ADD COLUMN "sourceType" TEXT;
ALTER TABLE "ResourceArticle" ADD COLUMN "sourceProjectId" TEXT;

CREATE UNIQUE INDEX "ResourceArticle_sourceProjectId_key" ON "ResourceArticle"("sourceProjectId");
CREATE INDEX "ResourceArticle_sourceType_idx" ON "ResourceArticle"("sourceType");
CREATE INDEX "Project_status_isFeatured_idx" ON "Project"("status", "isFeatured");
