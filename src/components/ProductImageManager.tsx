/* eslint-disable @next/next/no-img-element */

"use client";

import { useMemo, useState } from "react";

type ExistingProductImage = {
  id: string;
  imagePath: string;
  altText: string;
  sortOrder: number;
  isPrimary: boolean;
};

export function ProductImageManager({ existingImages }: { existingImages: ExistingProductImage[] }) {
  const [previews, setPreviews] = useState<Array<{ name: string; url: string; size: number }>>([]);
  const primaryDefault = existingImages.find((image) => image.isPrimary)?.id ?? existingImages[0]?.id ?? "new-0";
  const helpText = useMemo(() => {
    const remaining = Math.max(0, 3 - existingImages.length);
    return existingImages.length
      ? remaining
        ? `Keep at least 3 images after deletions. Add ${remaining} more image${remaining === 1 ? "" : "s"} when replacing product photos.`
        : "Keep at least 3 images after deletions. Add more images when replacing product photos."
      : "Upload at least 3 product images. JPG, PNG and WebP files up to 2 MB each are accepted.";
  }, [existingImages.length]);

  return (
    <div className="field wide image-upload-field">
      <span>Product images</span>
      <p className="field-help">{helpText}</p>
      <input
        name="productImages"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        onChange={(event) => {
          previews.forEach((preview) => URL.revokeObjectURL(preview.url));
          const files = Array.from(event.target.files ?? []);
          setPreviews(files.map((file) => ({ name: file.name, size: file.size, url: URL.createObjectURL(file) })));
        }}
      />

      {existingImages.length ? (
        <div className="admin-image-grid">
          {existingImages.map((image) => (
            <div className="admin-image-card" key={image.id}>
              <img src={image.imagePath} alt={image.altText} />
              <input type="hidden" name="existingImageId" value={image.id} />
              <label>
                <span>Alt text</span>
                <input name={`imageAlt_${image.id}`} defaultValue={image.altText} />
              </label>
              <label>
                <span>Sort order</span>
                <input name={`imageSort_${image.id}`} type="number" defaultValue={image.sortOrder} />
              </label>
              <label className="check-field compact-check">
                <input type="radio" name="primaryImage" value={image.id} defaultChecked={primaryDefault === image.id} />
                Primary
              </label>
              <label className="check-field compact-check danger-text">
                <input type="checkbox" name="deleteImageId" value={image.id} />
                Delete image
              </label>
            </div>
          ))}
        </div>
      ) : null}

      {previews.length ? (
        <div className="admin-image-grid">
          {previews.map((preview, index) => (
            <div className="admin-image-card" key={preview.url}>
              <img src={preview.url} alt="" />
              <strong>{preview.name}</strong>
              <small>{Math.round(preview.size / 1024)} KB</small>
              <label className="check-field compact-check">
                <input type="radio" name="primaryImage" value={`new-${index}`} defaultChecked={!existingImages.length && index === 0} />
                Primary
              </label>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
