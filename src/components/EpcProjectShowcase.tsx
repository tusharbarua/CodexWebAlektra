"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { numberFormat } from "@/lib/format";

const fallbackSolar = "https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&w=1400&q=80";

export type EpcProjectShowcaseProject = {
  id: string;
  title: string;
  clientName: string | null;
  location: string;
  projectType: string;
  capacityKw: number;
  commissionedAt: string | null;
  coverImage: string | null;
  summary: string;
  inverterBrandModel: string | null;
  moduleBrandModel: string | null;
  slug: string;
  isFeatured: boolean;
  images: Array<{ imagePath: string; altText: string | null }>;
};

export default function EpcProjectShowcase({ projects }: { projects: EpcProjectShowcaseProject[] }) {
  const defaultProject = useMemo(() => projects.find((project) => project.isFeatured) ?? projects[0], [projects]);
  const [selectedProjectId, setSelectedProjectId] = useState(defaultProject?.id);
  const listRef = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(false);
  const resumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const featured = projects.find((project) => project.id === selectedProjectId) ?? defaultProject;
  const sideProjects = featured ? projects.filter((project) => project.id !== featured.id) : [];

  useEffect(() => {
    setSelectedProjectId(defaultProject?.id);
  }, [defaultProject?.id]);

  useEffect(() => {
    return () => {
      if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    };
  }, []);

  useEffect(() => {
    const list = listRef.current;
    if (!list || sideProjects.length < 2) return;
    if (!window.matchMedia("(min-width: 1024px)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const interval = window.setInterval(() => {
      if (pausedRef.current || !listRef.current) return;
      const activeList = listRef.current;
      const firstCard = activeList.querySelector<HTMLElement>(".project-side-card");
      const step = firstCard ? firstCard.offsetHeight + 12 : 144;
      const nextTop = activeList.scrollTop + step;
      const atEnd = nextTop + activeList.clientHeight >= activeList.scrollHeight - 4;
      activeList.scrollTo({ top: atEnd ? 0 : nextTop, behavior: "smooth" });
    }, 3600);

    return () => window.clearInterval(interval);
  }, [sideProjects.length]);

  if (!featured) return null;

  const featuredImage = projectImage(featured);
  const equipment = [featured.moduleBrandModel, featured.inverterBrandModel].filter(Boolean).join(" · ") || "Selected by project scope";

  function pauseBriefly() {
    pausedRef.current = true;
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    resumeTimerRef.current = setTimeout(() => {
      pausedRef.current = false;
    }, 2600);
  }

  return (
    <div className="epc-project-showcase featured-projects-layout">
      <article className="epc-featured-project featured-project-card epc-crystal-card">
        <p className="featured-project-kicker">{numberFormat(featured.capacityKw)} kW · {featured.projectType}</p>
        <h3 className="featured-project-title">{featured.title}</h3>
        <div className="featured-project-image-wrap">
          <div className="featured-project-image" style={{ backgroundImage: `url(${featuredImage})` }} role="img" aria-label={featured.images[0]?.altText || featured.title} />
        </div>
        <p className="featured-project-description">{featured.summary}</p>
        <dl>
          <div><dt>Client</dt><dd>{featured.clientName ?? "Commercial client"}</dd></div>
          <div><dt>Location</dt><dd>{featured.location}</dd></div>
          <div><dt>Equipment</dt><dd>{equipment}</dd></div>
        </dl>
      </article>

      <div
        className="epc-project-rail project-side-list"
        ref={listRef}
        onMouseEnter={() => { pausedRef.current = true; }}
        onMouseLeave={() => { pausedRef.current = false; }}
        onScroll={pauseBriefly}
      >
        {sideProjects.map((project) => (
          <button
            type="button"
            className={`epc-project-mini project-side-card epc-crystal-card ${project.id === selectedProjectId ? "is-active" : ""}`}
            key={project.id}
            onClick={() => setSelectedProjectId(project.id)}
          >
            <div className="project-side-thumb">
              <div className="project-side-thumb-image" style={{ backgroundImage: `url(${projectImage(project)})` }} role="img" aria-label={project.images[0]?.altText || project.title} />
            </div>
            <div>
              <p className="project-side-kicker">{project.location}</p>
              <h4>{project.title}</h4>
              <p className="project-side-excerpt">{project.summary}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function projectImage(project: EpcProjectShowcaseProject) {
  return project.images[0]?.imagePath ?? project.coverImage ?? fallbackSolar;
}
