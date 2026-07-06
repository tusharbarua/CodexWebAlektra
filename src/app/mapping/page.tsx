import {
  Binary,
  Boxes,
  Building2,
  Camera,
  Check,
  CircuitBoard,
  Cloud,
  Crosshair,
  Database,
  FileArchive,
  FileSearch,
  Landmark,
  Layers3,
  Map,
  MapPinned,
  Milestone,
  Plane,
  RadioTower,
  Route,
  ScanLine,
  Search,
  Sparkles,
  SquareStack,
  Zap
} from "lucide-react";
import { PageKey } from "@prisma/client";
import { HeroMediaBackground } from "@/components/HeroMediaBackground";
import { MappingRequestForm } from "@/components/MappingRequestForm";
import { getPrimaryHeroMedia } from "@/lib/hero-media";
import { MarkdownBlock, getPublishedPage, sectionByKey, settings } from "@/lib/page-cms";

export const dynamic = "force-dynamic";

const iconMap = {
  Binary,
  Boxes,
  Building2,
  Camera,
  Check,
  CircuitBoard,
  Cloud,
  Crosshair,
  Database,
  FileArchive,
  FileSearch,
  Landmark,
  Layers3,
  Map,
  MapPinned,
  Milestone,
  Plane,
  RadioTower,
  Route,
  ScanLine,
  Search,
  Sparkles,
  SquareStack,
  Zap
};

const fallbackHero = {
  kicker: "AI-Powered Drone Mapping & 3D Geospatial Intelligence",
  title: "Alektra Mapping",
  subtitle: "Advanced Photogrammetry & LiDAR Mapping for Assets, Heritage, Infrastructure, and Power Corridors",
  body: "Alektra Mapping transforms real-world sites, structures, corridors, and assets into accurate digital intelligence. Using drone-based data acquisition, AI-assisted processing, advanced stitching software, and our proprietary mapping workflow, we deliver high-resolution orthomosaics, 3D models, digital twins, asset maps, inspection datasets, and geospatial documentation for smarter engineering, maintenance, preservation, and decision-making."
};

export async function generateMetadata() {
  const page = await getPublishedPage(PageKey.mapping);
  return {
    title: page?.metaTitle ?? "Alektra Mapping | Drone Mapping, Photogrammetry, LiDAR and 3D Digital Twin Documentation",
    description: page?.metaDescription ?? "Advanced aerial mapping, 3D visualization, photogrammetry, LiDAR, digital twin and geospatial documentation services."
  };
}

export default async function MappingPage() {
  const [page, heroMedia] = await Promise.all([
    getPublishedPage(PageKey.mapping),
    getPrimaryHeroMedia(PageKey.mapping)
  ]);
  const hero = sectionByKey(page, "hero");
  const heroSettings = settings(hero?.settingsJson, {
    kicker: fallbackHero.kicker,
    primaryCtaText: "Request Mapping Service",
    primaryCtaLink: "#request",
    secondaryCtaText: "Explore Mapping Methods",
    secondaryCtaLink: "#methods",
    signature: "Whatever it is — we map it with precision.",
    posterImage: ""
  });
  const positioning = sectionByKey(page, "positioning");
  const ai = sectionByKey(page, "ai-workflow");
  const methods = sectionByKey(page, "methods");
  const matrix = sectionByKey(page, "comparison-matrix");
  const services = sectionByKey(page, "services");
  const deliverables = sectionByKey(page, "deliverables");
  const useCases = sectionByKey(page, "use-cases");
  const workflow = sectionByKey(page, "workflow");
  const request = sectionByKey(page, "request-form");
  const faq = sectionByKey(page, "faq");

  return (
    <main className="mapping-page">
      <section className="mapping-hero">
        <div className="mapping-hero-media-layer">
          <div className="mapping-hero-fallback" />
          <HeroMediaBackground
            media={heroMedia}
            videoClassName="mapping-hero-video"
            imageClassName="mapping-hero-video"
            fallbackVideoSrc="/uploads/hero/mapping/mapping-hero-video.mp4"
            fallbackPosterImage={String(heroSettings.posterImage || "")}
          />
        </div>
        <div className="mapping-prism-grid" />
        <div className="mapping-hero-overlay" />
        <div className="container mapping-hero-inner">
          <div className="mapping-hero-content">
            <p className="mapping-kicker">{String(heroSettings.kicker)}</p>
            <h1>{hero?.title ?? fallbackHero.title}</h1>
            <h2>{hero?.subtitle ?? fallbackHero.subtitle}</h2>
            <p>{hero?.body ?? fallbackHero.body}</p>
            <div className="mapping-signature">{String(heroSettings.signature)}</div>
            <div className="mapping-actions">
              <a className="mapping-primary-button" href={String(heroSettings.primaryCtaLink)}>{String(heroSettings.primaryCtaText)}</a>
              <a className="mapping-secondary-button" href={String(heroSettings.secondaryCtaLink)}>{String(heroSettings.secondaryCtaText)}</a>
            </div>
          </div>
        </div>
      </section>

      {positioning ? (
        <section className="mapping-section">
          <div className="container mapping-positioning">
            <MappingHeading kicker={positioning.subtitle ?? ""} title={positioning.title}>{positioning.body}</MappingHeading>
            <div className="mapping-card-grid">
              {positioning.items.map((item) => <MappingCard item={item} key={item.id} />)}
            </div>
          </div>
        </section>
      ) : null}

      {ai ? (
        <section className="mapping-section mapping-ai-section">
          <div className="container mapping-two-column">
            <div className="mapping-glass mapping-ai-panel">
              <MappingHeading kicker={ai.subtitle ?? ""} title={ai.title}>{ai.body}</MappingHeading>
            </div>
            <div className="mapping-orbit mapping-glass">
              {ai.items.map((item) => <MappingOrbitItem item={item} key={item.id} />)}
            </div>
          </div>
        </section>
      ) : null}

      {methods ? (
        <section className="mapping-section" id="methods">
          <div className="container">
            <MappingHeading kicker={methods.subtitle ?? ""} title={methods.title}>{methods.body}</MappingHeading>
            <div className="mapping-method-grid">
              {methods.items.map((item, index) => <MappingMethodCard item={item} featured={index === 1} key={item.id} />)}
            </div>
            <p className="mapping-note">Photogrammetry and LiDAR are not competing technologies. For some projects, combining both can provide precise geometry and rich visual texture.</p>
          </div>
        </section>
      ) : null}

      {matrix ? (
        <section className="mapping-section">
          <div className="container">
            <MappingHeading kicker={matrix.subtitle ?? ""} title={matrix.title}>{matrix.body}</MappingHeading>
            <div className="mapping-matrix mapping-glass">
              <div className="mapping-matrix-head"><span>Criteria</span><strong>Photogrammetry</strong><strong>LiDAR</strong></div>
              {matrix.items.map((item) => {
                const itemSettings = settings(item.settingsJson, { photogrammetry: "", lidar: "" });
                return <div className="mapping-matrix-row" key={item.id}><span>{item.title}</span><p>{String(itemSettings.photogrammetry)}</p><p>{String(itemSettings.lidar)}</p></div>;
              })}
            </div>
          </div>
        </section>
      ) : null}

      {services ? (
        <section className="mapping-section">
          <div className="container">
            <MappingHeading kicker={services.subtitle ?? ""} title={services.title}>{services.body}</MappingHeading>
            <div className="mapping-service-grid">
              {services.items.map((item) => <MappingCard item={item} key={item.id} />)}
            </div>
          </div>
        </section>
      ) : null}

      {deliverables ? (
        <section className="mapping-section mapping-deliverables-section">
          <div className="container">
            <div className="mapping-section-heading">
              <p className="mapping-kicker">{deliverables.subtitle ?? ""}</p>
              <h2>{deliverables.title}</h2>
              <p>{deliverables.body}</p>
            </div>
            <div className="mapping-deliverable-list">
              {deliverables.items.map((item) => <article className="mapping-glass mapping-deliverable" key={item.id}><Check size={18} /><span>{item.title}</span></article>)}
            </div>
          </div>
        </section>
      ) : null}

      {useCases ? (
        <section className="mapping-section">
          <div className="container">
            <MappingHeading kicker={useCases.subtitle ?? ""} title={useCases.title}>{useCases.body}</MappingHeading>
            <div className="mapping-use-grid">
              {useCases.items.map((item) => <MappingCard item={item} key={item.id} />)}
            </div>
          </div>
        </section>
      ) : null}

      {workflow ? (
        <section className="mapping-section">
          <div className="container">
            <MappingHeading kicker={workflow.subtitle ?? ""} title={workflow.title}>{workflow.body}</MappingHeading>
            <div className="mapping-workflow">
              {workflow.items.map((item, index) => {
                const Icon = iconMap[item.icon as keyof typeof iconMap] ?? Milestone;
                return <article className="mapping-workflow-step mapping-glass" key={item.id}><span>{item.badge ?? index + 1}</span><Icon size={22} /><h3>{item.title}</h3><p>{item.body}</p></article>;
              })}
            </div>
          </div>
        </section>
      ) : null}

      {request ? (
        <section className="mapping-section mapping-request-section" id="request">
          <div className="container">
            <MappingHeading kicker={request.subtitle ?? ""} title={request.title}>{request.body}</MappingHeading>
            <div className="mapping-form-shell mapping-glass">
              <MappingRequestForm />
            </div>
          </div>
        </section>
      ) : null}

      {faq ? (
        <section className="mapping-section mapping-faq">
          <div className="container">
            <MappingHeading kicker={faq.subtitle ?? ""} title={faq.title}>{faq.body}</MappingHeading>
            <div className="mapping-faq-list">
              {faq.items.map((item) => <details key={item.id}><summary>{item.title}</summary><MarkdownBlock value={item.body} /></details>)}
            </div>
          </div>
        </section>
      ) : null}
    </main>
  );
}

function MappingHeading({ kicker, title, children }: { kicker: string; title: string; children: React.ReactNode }) {
  return <div className="mapping-heading"><div><p className="mapping-kicker">{kicker}</p><h2>{title}</h2></div><p>{children}</p></div>;
}

function MappingCard({ item }: { item: { title: string; body: string | null; icon: string | null } }) {
  const Icon = iconMap[item.icon as keyof typeof iconMap] ?? Map;
  return <article className="mapping-card mapping-glass"><Icon size={24} /><h3>{item.title}</h3><p>{item.body}</p></article>;
}

function MappingOrbitItem({ item }: { item: { title: string; body: string | null; icon: string | null } }) {
  const Icon = iconMap[item.icon as keyof typeof iconMap] ?? Sparkles;
  return <article><Icon size={22} /><strong>{item.title}</strong><p>{item.body}</p></article>;
}

function MappingMethodCard({ item, featured }: { item: { title: string; body: string | null; badge: string | null }; featured?: boolean }) {
  const itemSettings = settings(item.body ? {} : null, {});
  void itemSettings;
  const sections = String(item.body ?? "").split(/\n\n+/).filter(Boolean);
  return (
    <article className={`mapping-method-card mapping-glass ${featured ? "featured" : ""}`}>
      <span className="mapping-method-badge">{item.badge}</span>
      <h3>{item.title}</h3>
      {sections.map((section) => <MarkdownBlock key={section} value={section} />)}
    </article>
  );
}
