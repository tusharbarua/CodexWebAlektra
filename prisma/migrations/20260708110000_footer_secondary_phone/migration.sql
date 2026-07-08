ALTER TABLE "SiteSettings" ADD COLUMN "secondaryPhone" TEXT;

UPDATE "SiteSettings"
SET
  "contactPhone" = CASE
    WHEN "contactPhone" = '+880 1735954 844' THEN '+880 1735 954 844'
    ELSE "contactPhone"
  END,
  "secondaryPhone" = COALESCE(NULLIF("secondaryPhone", ''), '+880 1877 572 234'),
  "address" = CASE
    WHEN "address" = 'Dhaka, Bangladesh' THEN 'Chattogram | Dhaka | Bangladesh'
    ELSE "address"
  END
WHERE "singletonKey" = 'footer';
