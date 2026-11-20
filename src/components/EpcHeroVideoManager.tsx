"use client";

/* eslint-disable @next/next/no-img-element -- Hero previews use original CMS and local blob URLs. */

import { Clapperboard, ExternalLink, Film, UploadCloud, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { epcHeroUploadEndpoint, formatHeroVideoSize, type EpcHeroPreview } from "@/lib/epc-hero-video";
import { divisionHeroLabels, getHeroUploadFormat, type DivisionHeroPageKey } from "@/lib/hero-upload-config";
import styles from "./EpcHeroVideoManager.module.css";

type UploadState = { kind: "idle" | "processing" | "success" } | { kind: "uploading"; percent: number | null } | { kind: "error"; message: string };

const dateFormat = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Dhaka" });

export function EpcHeroVideoManager({ initial, maxBytes }: { initial: EpcHeroPreview; maxBytes: number }) {
  return <HeroMediaManager pageKey="epc" initial={initial} maxBytes={maxBytes} />;
}

type ManagerProps = { initial: EpcHeroPreview; maxBytes: number } & (
  | { pageKey: "epc"; imageMaxBytes?: never }
  | { pageKey: DivisionHeroPageKey; imageMaxBytes: number }
);

export function HeroMediaManager({ pageKey, initial, maxBytes, imageMaxBytes }: ManagerProps) {
  const isHomepage = pageKey === "epc";
  const pageLabel = pageKey === "epc" ? "EPC homepage" : "Alektra " + divisionHeroLabels[pageKey];
  const livePath = isHomepage ? "/" : "/" + pageKey;
  const endpoint = isHomepage ? epcHeroUploadEndpoint : "/api/admin/hero-media/" + pageKey;
  const assetName = isHomepage ? "video" : "media";
  const currentHeadingId = pageKey + "-current-" + assetName;
  const replaceHeadingId = pageKey + "-replace-" + assetName;
  const [current, setCurrent] = useState(initial);
  const [failedCurrent, setFailedCurrent] = useState<string | null>(null);
  const [selected, setSelected] = useState<{ file: File; url: string; kind: "video" | "image"; mime: string } | null>(null);
  const [playable, setPlayable] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [upload, setUpload] = useState<UploadState>({ kind: "idle" });
  const picker = useRef<HTMLInputElement>(null);
  const busy = upload.kind === "uploading" || upload.kind === "processing";
  const previewUrl = selected?.url;
  const limit = formatHeroVideoSize(maxBytes);

  useEffect(() => {
    return () => { if (previewUrl) URL.revokeObjectURL(previewUrl); };
  }, [previewUrl]);

  function select(file: File | undefined) {
    setDragging(false);
    if (!file || busy) return;
    setPlayable(false);
    setSelected(null);
    const format = getHeroUploadFormat(file.name, !isHomepage);
    if (!format || (file.type && file.type !== "application/octet-stream" && file.type !== format.mime)) {
      setUpload({ kind: "error", message: isHomepage ? "Choose an MP4 or WebM video." : "Choose an MP4, WebM, JPEG, PNG or WebP file." });
      return;
    }
    const fileLimit = format.kind === "video" ? maxBytes : imageMaxBytes ?? maxBytes;
    if (!file.size || file.size > fileLimit) {
      const type = format.kind === "video" ? "a video" : "an image";
      setUpload({ kind: "error", message: !file.size ? "The selected file is empty." : "Choose " + type + " no larger than " + formatHeroVideoSize(fileLimit) + "." });
      return;
    }

    setUpload({ kind: "idle" });
    setSelected({ file, url: URL.createObjectURL(file), kind: format.kind, mime: format.mime });
  }

  function publish() {
    if (!selected || !playable || busy) return;
    const request = new XMLHttpRequest();
    request.open("POST", endpoint);
    request.setRequestHeader("Content-Type", selected.mime);
    request.setRequestHeader("X-Video-Filename", encodeURIComponent(selected.file.name));
    request.responseType = "json";
    request.timeout = 10 * 60 * 1000;
    request.upload.onprogress = ({ lengthComputable, loaded, total }) => {
      setUpload({ kind: "uploading", percent: lengthComputable && total ? Math.round(loaded / total * 100) : null });
    };
    request.upload.onload = () => setUpload({ kind: "processing" });
    request.onload = () => {
      if (request.status === 200 && request.response?.preview) {
        setCurrent(request.response.preview);
        setFailedCurrent(null);
        setSelected(null);
        setPlayable(false);
        setUpload({ kind: "success" });
        return;
      }
      const message = request.response?.error ?? (request.status === 413
        ? isHomepage ? "The server rejected the upload size. Choose a video under " + limit + " and try again." : "The server rejected the upload size. Choose a smaller file and try again."
        : "The upload failed (HTTP " + request.status + "). Check the current " + assetName + " before trying again.");
      setUpload({ kind: "error", message });
    };
    request.onerror = request.ontimeout = request.onabort = () => {
      setUpload({ kind: "error", message: "The connection ended before publication was confirmed. Reload to check the current " + assetName + " before retrying." });
    };
    setUpload({ kind: "uploading", percent: null });
    request.send(selected.file);
  }

  function previewFailed(message: string) {
    setPlayable(false);
    setSelected(null);
    setUpload({ kind: "error", message });
  }

  return (
    <div className={styles.manager}>
      <section className={`panel ${styles.card}`} aria-labelledby={currentHeadingId}>
        <div className={styles.heading}>
          <div><h2 id={currentHeadingId}>Current live hero</h2><p>{pageLabel} background</p></div>
          <span className="status-pill success">{current.kind === "fallback" ? "Bundled default" : "Published"}</span>
        </div>
        <div className={styles.screen}>
          {isHomepage && current.kind === "image" ? <div className={styles.notice}><Film aria-hidden="true" /><p>The homepage currently uses an image. Publishing a video will replace it as the active media.</p></div>
            : !current.source || failedCurrent === current.source ? <div className={styles.notice} role="status"><Film aria-hidden="true" /><p>{isHomepage ? "The current video could not load. Confirm it on the live homepage or upload a replacement." : "The current media could not load. Check the live page or upload a replacement."}</p></div>
              : current.kind === "image" ? <img key={current.source} className={styles.imagePreview} src={current.source} alt="Current hero image" onError={() => setFailedCurrent(current.source)} />
                : <video key={current.source} src={current.source} poster={current.poster ?? undefined} controls muted playsInline preload="metadata"
                  aria-label={isHomepage ? "Current homepage hero video" : "Current hero video"} onError={() => setFailedCurrent(current.source)} />}
        </div>
        <dl className={styles.details}>
          <div><dt>File</dt><dd>{current.fileName ?? "Unavailable"}</dd></div>
          <div><dt>Size</dt><dd>{current.size === null ? "Unavailable" : formatHeroVideoSize(current.size)}</dd></div>
          <div><dt>Last updated</dt><dd>{current.updatedAt ? `${dateFormat.format(new Date(current.updatedAt))} (Dhaka)` : "Unavailable"}</dd></div>
        </dl>
        <a className={styles.link} href={livePath} target="_blank" rel="noopener">{isHomepage ? "View live homepage" : "View live " + pageLabel} <ExternalLink size={15} aria-hidden="true" /></a>
      </section>

      <section className={`panel ${styles.card}`} aria-labelledby={replaceHeadingId}>
        <div className={styles.heading}>
          <div><h2 id={replaceHeadingId}>{isHomepage ? "Replace homepage video" : "Replace hero media"}</h2><p>Preview a new file before putting it live.</p></div>
          <span className={styles.headingIcon}><Clapperboard size={20} aria-hidden="true" /></span>
        </div>
        <input ref={picker} aria-label={isHomepage ? "Choose a replacement video" : "Choose replacement hero media"} type="file"
          accept={isHomepage ? ".mp4,.webm,video/mp4,video/webm" : ".mp4,.webm,.jpg,.jpeg,.png,.webp,video/mp4,video/webm,image/jpeg,image/png,image/webp"} hidden disabled={busy}
          onChange={(event) => { select(event.target.files?.[0]); event.target.value = ""; }} />
        <div className={styles.drop} data-dragging={dragging} onDragOver={(event) => { event.preventDefault(); if (!busy) setDragging(true); }}
          onDragLeave={() => setDragging(false)} onDrop={(event) => { event.preventDefault(); select(event.dataTransfer.files[0]); }}>
          <UploadCloud size={27} aria-hidden="true" />
          <strong>{isHomepage ? "Drag and drop a video" : "Drag and drop an image or video"}</strong>
          <p>H.264 MP4 or VP8/VP9 WebM · up to {limit}{!isHomepage && imageMaxBytes !== undefined ? <><br />JPEG, PNG or WebP · up to {formatHeroVideoSize(imageMaxBytes)}</> : null}</p>
          <button type="button" className="btn secondary compact" disabled={busy} onClick={() => picker.current?.click()}>Browse files</button>
        </div>
        {selected ? <div className={styles.selection}>
          <div className={styles.file}><span><strong>{selected.file.name}</strong><small>{formatHeroVideoSize(selected.file.size)}</small></span>
            <button type="button" className={styles.remove} aria-label={isHomepage ? "Remove selected video" : "Remove selected file"} disabled={busy} onClick={() => { setSelected(null); setPlayable(false); setUpload({ kind: "idle" }); }}><X size={19} aria-hidden="true" /></button></div>
          <div className={styles.screen}>
            {selected.kind === "image"
              ? <img key={selected.url} className={styles.imagePreview} src={selected.url} alt="Replacement image preview"
                onLoad={() => setPlayable(true)} onError={() => previewFailed("This browser cannot open the selected image. Choose another JPEG, PNG or WebP.")} />
              : <video key={selected.url} src={selected.url} controls muted playsInline preload="auto" aria-label="Replacement video preview"
                onCanPlay={() => setPlayable(true)} onError={() => previewFailed("This browser cannot play the selected video. Export it as an H.264 MP4 and try again.")} />}
          </div>
        </div> : null}
        <div className={styles.feedback} aria-live="polite">
          {upload.kind === "uploading" ? <><span>{upload.percent === null ? "Uploading " + assetName + "…" : "Uploading " + assetName + " — " + upload.percent + "%"}</span><progress aria-label={isHomepage ? "Video upload progress" : "Media upload progress"} max={100} value={upload.percent ?? undefined} /></> : null}
          {upload.kind === "processing" ? <span>Processing and verifying {assetName}…</span> : null}
          {upload.kind === "error" ? <p className="admin-error">{upload.message}</p> : null}
          {upload.kind === "success" ? <p className="admin-success">{isHomepage ? "Homepage hero video successfully updated." : pageLabel + " hero media successfully updated."} <a href={livePath} target="_blank" rel="noopener">{isHomepage ? "Inspect the live homepage" : "Inspect the live page"}</a></p> : null}
          {upload.kind === "idle" && selected && !playable ? <span>Checking {selected.kind} preview…</span> : null}
        </div>
        <button type="button" className={`btn ${styles.publish}`} disabled={!selected || !playable || busy} onClick={publish}>Upload &amp; Update Hero {isHomepage ? "Video" : "Media"}</button>
      </section>
    </div>
  );
}
