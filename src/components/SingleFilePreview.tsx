/* eslint-disable @next/next/no-img-element */

"use client";

import { useState } from "react";

export function SingleFilePreview({
  name,
  accept,
  label,
  existingUrl,
  isVideo = false
}: {
  name: string;
  accept: string;
  label: string;
  existingUrl?: string | null;
  isVideo?: boolean;
}) {
  const [preview, setPreview] = useState<string | null>(null);
  const [previewIsVideo, setPreviewIsVideo] = useState(isVideo);

  return (
    <div className="field wide image-upload-field">
      <span>{label}</span>
      <input
        name={name}
        type="file"
        accept={accept}
        onChange={(event) => {
          if (preview) URL.revokeObjectURL(preview);
          const file = event.target.files?.[0];
          setPreview(file ? URL.createObjectURL(file) : null);
          setPreviewIsVideo(file ? file.type.startsWith("video/") : isVideo);
        }}
      />
      {(preview || existingUrl) ? (
        <div className="admin-upload-preview">
          {previewIsVideo ? (
            <video src={preview ?? existingUrl ?? undefined} controls muted playsInline />
          ) : (
            <img src={preview ?? existingUrl ?? ""} alt="" />
          )}
        </div>
      ) : null}
    </div>
  );
}
