/* eslint-disable @next/next/no-img-element */

"use client";

import { useState } from "react";

type GalleryImage = {
  id: string;
  imagePath: string;
  altText: string;
};

export function ProductGallery({ images, productName }: { images: GalleryImage[]; productName: string }) {
  const [active, setActive] = useState(0);
  const current = images[active] ?? images[0];

  return (
    <div className="product-gallery">
      <div className="product-gallery-main">
        <img src={current.imagePath} alt={current.altText || productName} />
      </div>
      {images.length > 1 ? (
        <div className="product-gallery-thumbs" aria-label="Product image gallery">
          {images.map((image, index) => (
            <button
              type="button"
              key={image.id}
              className={index === active ? "active" : ""}
              onClick={() => setActive(index)}
              aria-label={`Show image ${index + 1} for ${productName}`}
            >
              <img src={image.imagePath} alt="" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
