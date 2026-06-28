import { ArrowDown, Check, ClipboardCheck, Crosshair, FileSearch, Plane, ScanLine } from "lucide-react";
import { PageKey } from "@prisma/client";
import { ThermalAnomalyGrid, type ThermalAnomaly } from "@/components/ThermalAnomalyGrid";
import { ThermalInspectionForm } from "@/components/ThermalInspectionForm";
import { MarkdownBlock, getPublishedPage, lines, sectionByKey, settings } from "@/lib/page-cms";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const page = await getPublishedPage(PageKey.thermal);
  return {
    title: page?.metaTitle ?? "Alektra Thermal | Aerial Thermal Inspection for Solar PV Plants",
    description: page?.metaDescription ?? "Drone-based infrared and RGB inspection for rooftop and ground-mounted solar PV plants."
  };
}

const workflowIcons = { ClipboardCheck, Plane, Crosshair, ScanLine, FileSearch, Check };

export default async function ThermalPage() {
  const page = await getPublishedPage(PageKey.thermal);
  const hero = sectionByKey(page, "hero");
  const heroSettings = settings(hero?.settingsJson, {
    kicker: "Drone-based IR + RGB intelligence",
    primaryCtaText: "Request an Inspection",
    primaryCtaLink: "#request",
    secondaryCtaText: "Explore Detected Anomalies",
    secondaryCtaLink: "#anomalies",
    minimumNote: "Minimum thermal inspection site size:",
    minimumValue: "50 kWp",
    posterImage: "https://images.unsplash.com/photo-1508614589041-895b88991e3e?auto=format&fit=crop&w=1800&q=80"
  });
  const heroMedia = hero?.items[0];
  const why = sectionByKey(page, "why-it-matters");
  const anomaliesSection = sectionByKey(page, "anomalies");
  const packageSection = sectionByKey(page, "packages");
  const workflowSection = sectionByKey(page, "workflow");
  const requestSection = sectionByKey(page, "request-form");
  const faqSection = sectionByKey(page, "faq");

  const anomalies: ThermalAnomaly[] = (anomaliesSection?.items ?? []).map((item) => {
    const itemSettings = settings(item.settingsJson, { inspectionValue: "", category: "" });
    return {
      id: item.id,
      name: item.title,
      description: item.body ?? "",
      severity: item.badge ?? "Medium",
      icon: item.icon,
      inspectionValue: String(itemSettings.inspectionValue || "")
    };
  });

  return <main className="thermal-page">
    {hero ? <section className="thermal-hero">
      <video className="thermal-hero-video" autoPlay muted loop playsInline poster={heroMedia?.imagePath ?? String(heroSettings.posterImage)}>
        <source src={heroMedia?.videoPath ?? "/videos/thermal-drone.mp4"} type="video/mp4" />
      </video>
      <div className="thermal-hero-overlay" />
      <div className="thermal-atmosphere" />
      <div className="container thermal-hero-content">
        <p className="thermal-kicker">{String(heroSettings.kicker)}</p><h1>{hero.title}</h1>
        {hero.subtitle ? <h2>{hero.subtitle}</h2> : null}
        <p>{hero.body}</p>
        <div className="thermal-actions"><a className="thermal-primary-button" href={String(heroSettings.primaryCtaLink)}>{String(heroSettings.primaryCtaText)}</a><a className="thermal-secondary-button" href={String(heroSettings.secondaryCtaLink)}>{String(heroSettings.secondaryCtaText)} <ArrowDown size={18}/></a></div>
        <div className="thermal-minimum">{String(heroSettings.minimumNote)} <strong>{String(heroSettings.minimumValue)}</strong></div>
      </div>
    </section> : null}

    {why ? <section className="thermal-section thermal-intro"><div className="container thermal-split">
      <div><p className="thermal-kicker">{why.subtitle}</p><h2>{why.title}</h2></div>
      <div className="thermal-glass-card"><MarkdownBlock value={why.body} /></div>
    </div></section> : null}

    {anomaliesSection ? <section className="thermal-section" id="anomalies"><div className="container">
      <ThermalHeading kicker={anomaliesSection.subtitle ?? ""} title={anomaliesSection.title}>{anomaliesSection.body}</ThermalHeading>
      <ThermalAnomalyGrid anomalies={anomalies} />
    </div></section> : null}

    {packageSection ? <section className="thermal-section thermal-packages"><div className="container">
      <ThermalHeading kicker={packageSection.subtitle ?? ""} title={packageSection.title}>{packageSection.body}</ThermalHeading>
      <div className="thermal-package-grid">
        {packageSection.items.map((item) => {
          const itemSettings = settings(item.settingsJson, { tags: [] as string[], featured: false });
          return <Package key={item.id} title={item.title} badge={item.badge ?? ""} points={lines(item.body)} tags={Array.isArray(itemSettings.tags) ? itemSettings.tags.map(String) : []} ctaText={item.linkText ?? "Request an Inspection"} ctaLink={item.linkUrl ?? "#request"} featured={Boolean(itemSettings.featured)} />;
        })}
      </div>
    </div></section> : null}

    {workflowSection ? <section className="thermal-section"><div className="container">
      <ThermalHeading kicker={workflowSection.subtitle ?? ""} title={workflowSection.title}>{workflowSection.body}</ThermalHeading>
      <div className="thermal-workflow">{workflowSection.items.map((item, index) => {
        const WorkflowIcon = workflowIcons[item.icon as keyof typeof workflowIcons] ?? Plane;
        return <div className="workflow-step" key={item.id}><span>{item.badge ?? index + 1}</span><WorkflowIcon size={25}/><h3>{item.title}</h3><p>{item.body}</p></div>;
      })}</div>
    </div></section> : null}

    {requestSection ? <section className="thermal-section thermal-request-section" id="request"><div className="container">
      <ThermalHeading kicker={requestSection.subtitle ?? ""} title={requestSection.title}>{requestSection.body}</ThermalHeading>
      <ThermalInspectionForm />
    </div></section> : null}

    {faqSection ? <section className="thermal-section thermal-faq"><div className="container">
      <ThermalHeading kicker={faqSection.subtitle ?? ""} title={faqSection.title}>{faqSection.body}</ThermalHeading>
      <div className="faq-list">
        {faqSection.items.map((item) => <Faq question={item.title} key={item.id}>{item.body}</Faq>)}
      </div>
    </div></section> : null}
  </main>;
}

function ThermalHeading({ kicker, title, children }: { kicker: string; title: string; children: React.ReactNode }) {
  return <div className="thermal-heading"><div><p className="thermal-kicker">{kicker}</p><h2>{title}</h2></div><p>{children}</p></div>;
}
function Package({ title, badge, points, tags, ctaText, ctaLink, featured = false }: { title: string; badge: string; points: readonly string[]; tags: string[]; ctaText: string; ctaLink: string; featured?: boolean }) {
  return <article className={`thermal-package-card ${featured ? "featured" : ""}`}><span className="package-badge">{badge}</span><h3>{title}</h3><ul>{points.map((point) => <li key={point}><Check size={16}/>{point}</li>)}</ul><div className="thermal-tags">{tags.map((tag) => <span key={tag}>{tag}</span>)}</div><a href={ctaLink} className="thermal-primary-button">{ctaText}</a></article>;
}
function Faq({ question, children }: { question: string; children: React.ReactNode }) { return <details><summary>{question}</summary><p>{children}</p></details>; }

