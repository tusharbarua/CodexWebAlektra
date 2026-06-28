/* eslint-disable @next/next/no-img-element */

"use client";

import { useState } from "react";

type ExistingImage = {
  id: string;
  imagePath: string;
  altText: string;
  sortOrder: number;
  isPrimary: boolean;
};

export function ProjectImageManager({ existingImages }: { existingImages: ExistingImage[] }) {
  const [previews, setPreviews] = useState<Array<{ name: string; url: string; size: number }>>([]);
  const primaryDefault = existingImages.find((image) => image.isPrimary)?.id ?? existingImages[0]?.id ?? "new-project-0";

  return (
    <div className="field wide image-upload-field">
      <span>Project images</span>
      <p className="field-help">Upload JPG, PNG or WebP images up to 3 MB each. Select one primary image for public project cards.</p>
      <input
        name="projectImages"
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
              <label><span>Alt text</span><input name={`projectImageAlt_${image.id}`} defaultValue={image.altText} /></label>
              <label><span>Sort order</span><input name={`projectImageSort_${image.id}`} type="number" defaultValue={image.sortOrder} /></label>
              <label className="check-field compact-check"><input type="radio" name="primaryProjectImage" value={image.id} defaultChecked={primaryDefault === image.id} /> Primary</label>
              <label className="check-field compact-check danger-text"><input type="checkbox" name="deleteProjectImageId" value={image.id} /> Delete</label>
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
              <label className="check-field compact-check"><input type="radio" name="primaryProjectImage" value={`new-project-${index}`} defaultChecked={!existingImages.length && index === 0} /> Primary</label>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

