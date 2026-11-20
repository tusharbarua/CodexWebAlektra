"use client";

import Image from "next/image";
import { ArrowUpRight, Play, X } from "lucide-react";
import { useRef, useState, type MouseEvent } from "react";
import styles from "./SolisProjectVideos.module.css";

type ProjectVideo = {
  id: string;
  youtubeUrl: string;
  aspectRatio: "16:9" | "9:16";
  project: string;
  specifications: readonly string[];
  thumbnail: { file: string; width: number; height: number };
};

const videos = [
  {
    id: "AS3nX_Ndq8E",
    youtubeUrl: "https://youtu.be/AS3nX_Ndq8E",
    aspectRatio: "16:9",
    project: "Shamsun Nahar Agro",
    specifications: ["125 kWp rooftop solar PV", "125 kW Solis hybrid inverter", "100 kWh Solis FlexCore-ID ESS"],
    thumbnail: { file: "maxresdefault.jpg", width: 1280, height: 720 }
  },
  {
    id: "bMRwdwcR6I8",
    youtubeUrl: "https://youtube.com/shorts/bMRwdwcR6I8",
    aspectRatio: "9:16",
    project: "Hathazari Foods (Q&Q Foods)",
    specifications: ["100 kWp rooftop solar PV", "50 kW Solis on-grid + 50 kW Solis hybrid", "80 kWh Solis FlexCore-ID ESS"],
    thumbnail: { file: "oar2.jpg", width: 1080, height: 1920 }
  },
  {
    id: "NAynisj_9Ww",
    youtubeUrl: "https://youtube.com/shorts/NAynisj_9Ww",
    aspectRatio: "9:16",
    project: "Hakkani Group",
    specifications: ["150 kW on-grid inverter capacity", "30 kW Solis hybrid inverter", "60 kWh Solis FlexCore-ID ESS"],
    thumbnail: { file: "oar2.jpg", width: 1080, height: 1920 }
  }
] satisfies readonly ProjectVideo[];

const standardThumbnail = { file: "hqdefault.jpg", width: 480, height: 360 };

function YouTubeLink({ video }: { video: ProjectVideo }) {
  return (
    <a className={styles.link} href={video.youtubeUrl} target="_blank" rel="noopener noreferrer" aria-label={`Watch ${video.project} on YouTube (opens in a new tab)`}>
      Watch on YouTube <ArrowUpRight size={15} aria-hidden="true" />
    </a>
  );
}

function VideoCard({ video, onOpen }: { video: ProjectVideo; onOpen: (event: MouseEvent<HTMLButtonElement>) => void }) {
  const [thumbnail, setThumbnail] = useState<ProjectVideo["thumbnail"] | null>(video.thumbnail);

  return (
    <article className={`${styles.card} epc-crystal-card`} data-ratio={video.aspectRatio}>
      <button type="button" className={styles.poster} aria-label={`Play ${video.project}`} aria-haspopup="dialog" onClick={onOpen}>
        {thumbnail && (
          <Image
            className={styles.thumbnail}
            src={`https://i.ytimg.com/vi/${video.id}/${thumbnail.file}`}
            alt=""
            width={thumbnail.width}
            height={thumbnail.height}
            loading="lazy"
            unoptimized
            onError={() => setThumbnail(thumbnail === standardThumbnail ? null : standardThumbnail)}
          />
        )}
        <span className={styles.play}><Play size={21} fill="currentColor" aria-hidden="true" /></span>
      </button>
      <div className={styles.details}>
        <p className={styles.attribution}>Featured by Solis</p>
        <h3>{video.project}</h3>
        <ul>
          {video.specifications.map((specification) => <li key={specification}>{specification}</li>)}
        </ul>
        <YouTubeLink video={video} />
      </div>
    </article>
  );
}

export default function SolisProjectVideos() {
  const [activeVideo, setActiveVideo] = useState<ProjectVideo | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const openerRef = useRef<HTMLButtonElement>(null);

  function openVideo(video: ProjectVideo, event: MouseEvent<HTMLButtonElement>) {
    openerRef.current = event.currentTarget;
    setActiveVideo(video);
    dialogRef.current?.showModal();
    closeRef.current?.focus();
  }

  function closeVideo() {
    setActiveVideo(null);
    openerRef.current?.focus({ preventScroll: true });
  }

  return (
    <section className="epc-section" id="solis-project-videos" aria-labelledby="solis-project-videos-title">
      <div className="container">
        <div className="epc-section-heading">
          <h2 id="solis-project-videos-title">Our Projects, Featured by Solis</h2>
          <p>Discover real-world solar and energy-storage solutions engineered by Alektra Renewable and showcased by Solis.</p>
        </div>
        <div className={styles.grid}>
          {videos.map((video) => <VideoCard key={video.id} video={video} onOpen={(event) => openVideo(video, event)} />)}
        </div>
      </div>

      <dialog className={styles.dialog} ref={dialogRef} data-ratio={activeVideo?.aspectRatio} aria-labelledby="solis-video-title" onClose={closeVideo}>
        <div className={styles.dialogHeader}>
          <h2 id="solis-video-title">{activeVideo?.project}</h2>
          <button className={styles.close} ref={closeRef} type="button" aria-label="Close video" onClick={() => dialogRef.current?.close()}>
            <X size={22} aria-hidden="true" />
          </button>
        </div>
        {activeVideo && (
          <>
            <iframe
              key={activeVideo.id}
              className={styles.player}
              src={`https://www.youtube-nocookie.com/embed/${activeVideo.id}?playsinline=1`}
              title={`${activeVideo.project} video by Solis`}
              referrerPolicy="strict-origin-when-cross-origin"
              allow="fullscreen; encrypted-media; picture-in-picture"
              allowFullScreen
            />
            <YouTubeLink video={activeVideo} />
          </>
        )}
      </dialog>
    </section>
  );
}
