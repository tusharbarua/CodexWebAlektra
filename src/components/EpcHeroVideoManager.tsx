"use client";

import { Clapperboard, ExternalLink, Film, UploadCloud, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { epcHeroUploadEndpoint, epcHeroVideoTypes, epcVideoExtension, formatHeroVideoSize, type EpcHeroPreview } from "@/lib/epc-hero-video";
import styles from "./EpcHeroVideoManager.module.css";

type UploadState = { kind: "idle" | "processing" | "success" } | { kind: "uploading"; percent: number | null } | { kind: "error"; message: string };

const dateFormat = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Dhaka" });

export function EpcHeroVideoManager({ initial, maxBytes }: { initial: EpcHeroPreview; maxBytes: number }) {
  const [current, setCurrent] = useState(initial);
  const [failedCurrent, setFailedCurrent] = useState<string | null>(null);
  const [selected, setSelected] = useState<{ file: File; url: string } | null>(null);
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
    const extension = epcVideoExtension(file.name);
    if (!extension || (file.type && file.type !== "application/octet-stream" && file.type !== epcHeroVideoTypes[extension])) {
      setUpload({ kind: "error", message: "Choose an MP4 or WebM video." });
    } else if (!file.size || file.size > maxBytes) {
      setUpload({ kind: "error", message: !file.size ? "The selected file is empty." : `Choose a video no larger than ${limit}.` });
    } else {
      setUpload({ kind: "idle" });
      setSelected({ file, url: URL.createObjectURL(file) });
    }
  }

  function publish() {
    if (!selected || !playable || busy) return;
    const extension = epcVideoExtension(selected.file.name);
    if (!extension) return;
    const request = new XMLHttpRequest();
    request.open("POST", epcHeroUploadEndpoint);
    request.setRequestHeader("Content-Type", epcHeroVideoTypes[extension]);
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
        ? `The server rejected the upload size. Choose a video under ${limit} and try again.`
        : `The upload failed (HTTP ${request.status}). Check the current video before trying again.`);
      setUpload({ kind: "error", message });
    };
    request.onerror = request.ontimeout = request.onabort = () => {
      setUpload({ kind: "error", message: "The connection ended before publication was confirmed. Reload to check the current video before retrying." });
    };
    setUpload({ kind: "uploading", percent: null });
    request.send(selected.file);
  }

  return (
    <div className={styles.manager}>
      <section className={`panel ${styles.card}`} aria-labelledby="epc-current-video">
        <div className={styles.heading}>
          <div><h2 id="epc-current-video">Current live hero</h2><p>EPC homepage background</p></div>
          <span className="status-pill success">{current.kind === "fallback" ? "Bundled default" : "Published"}</span>
        </div>
        <div className={styles.screen}>
          {current.kind === "image" ? <div className={styles.notice}><Film aria-hidden="true" /><p>The homepage currently uses an image. Publishing a video will replace it as the active media.</p></div>
            : !current.source || failedCurrent === current.source ? <div className={styles.notice} role="status"><Film aria-hidden="true" /><p>The current video could not load. Confirm it on the live homepage or upload a replacement.</p></div>
              : <video key={current.source} src={current.source} poster={current.poster ?? undefined} controls muted playsInline preload="metadata"
                aria-label="Current homepage hero video" onError={() => setFailedCurrent(current.source)} />}
        </div>
        <dl className={styles.details}>
          <div><dt>File</dt><dd>{current.fileName ?? "Unavailable"}</dd></div>
          <div><dt>Size</dt><dd>{current.size === null ? "Unavailable" : formatHeroVideoSize(current.size)}</dd></div>
          <div><dt>Last updated</dt><dd>{current.updatedAt ? `${dateFormat.format(new Date(current.updatedAt))} (Dhaka)` : "Unavailable"}</dd></div>
        </dl>
        <a className={styles.link} href="/" target="_blank" rel="noopener">View live homepage <ExternalLink size={15} aria-hidden="true" /></a>
      </section>

      <section className={`panel ${styles.card}`} aria-labelledby="epc-replace-video">
        <div className={styles.heading}>
          <div><h2 id="epc-replace-video">Replace homepage video</h2><p>Preview a new file before putting it live.</p></div>
          <span className={styles.headingIcon}><Clapperboard size={20} aria-hidden="true" /></span>
        </div>
        <input ref={picker} aria-label="Choose a replacement video" type="file" accept=".mp4,.webm,video/mp4,video/webm" hidden disabled={busy}
          onChange={(event) => { select(event.target.files?.[0]); event.target.value = ""; }} />
        <div className={styles.drop} data-dragging={dragging} onDragOver={(event) => { event.preventDefault(); if (!busy) setDragging(true); }}
          onDragLeave={() => setDragging(false)} onDrop={(event) => { event.preventDefault(); select(event.dataTransfer.files[0]); }}>
          <UploadCloud size={27} aria-hidden="true" />
          <strong>Drag and drop a video</strong>
          <p>H.264 MP4 or VP8/VP9 WebM · up to {limit}</p>
          <button type="button" className="btn secondary compact" disabled={busy} onClick={() => picker.current?.click()}>Browse files</button>
        </div>
        {selected ? <div className={styles.selection}>
          <div className={styles.file}><span><strong>{selected.file.name}</strong><small>{formatHeroVideoSize(selected.file.size)}</small></span>
            <button type="button" className={styles.remove} aria-label="Remove selected video" disabled={busy} onClick={() => { setSelected(null); setPlayable(false); setUpload({ kind: "idle" }); }}><X size={19} aria-hidden="true" /></button></div>
          <div className={styles.screen}><video key={selected.url} src={selected.url} controls muted playsInline preload="auto" aria-label="Replacement video preview"
            onCanPlay={() => setPlayable(true)} onError={() => { setPlayable(false); setSelected(null); setUpload({ kind: "error", message: "This browser cannot play the selected video. Export it as an H.264 MP4 and try again." }); }} /></div>
        </div> : null}
        <div className={styles.feedback} aria-live="polite">
          {upload.kind === "uploading" ? <><span>{upload.percent === null ? "Uploading video…" : `Uploading video — ${upload.percent}%`}</span><progress aria-label="Video upload progress" max={100} value={upload.percent ?? undefined} /></> : null}
          {upload.kind === "processing" ? <span>Processing and verifying video…</span> : null}
          {upload.kind === "error" ? <p className="admin-error">{upload.message}</p> : null}
          {upload.kind === "success" ? <p className="admin-success">Homepage hero video successfully updated. <a href="/" target="_blank" rel="noopener">Inspect the live homepage</a></p> : null}
          {upload.kind === "idle" && selected && !playable ? <span>Checking video preview…</span> : null}
        </div>
        <button type="button" className={`btn ${styles.publish}`} disabled={!selected || !playable || busy} onClick={publish}>Upload &amp; Update Hero Video</button>
      </section>
    </div>
  );
}
