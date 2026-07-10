import { PageKey, PublishStatus } from "@prisma/client";
import Link from "next/link";
import {
  ArrowRight,
  Award,
  BatteryCharging,
  Boxes,
  Building2,
  CheckCircle2,
  CircuitBoard,
  Droplets,
  Eye,
  FileText,
  Globe2,
  Leaf,
  Map,
  MonitorCheck,
  PackageCheck,
  Plane,
  Radar,
  ShieldCheck,
  Sparkles,
  Sun,
  Waves,
  Zap
} from "lucide-react";
import { HeroMediaBackground } from "@/components/HeroMediaBackground";
import { ImpactDashboard } from "@/components/ImpactDashboard";
import { EpcProposalButton } from "@/components/EpcProposalButton";
import { EpcProposalForm } from "@/components/EpcProposalForm";
import EpcProjectShowcase from "@/components/EpcProjectShowcase";
import { getPrimaryHeroMedia } from "@/lib/hero-media";
import { MarkdownBlock, getPublishedPage, sectionByKey, settings } from "@/lib/page-cms";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const iconMap = {
  Award,
  BatteryCharging,
  Boxes,
  Building2,
  CheckCircle2,
  CircuitBoard,
  Droplets,
  Eye,
  FileText,
  Globe2,
  Leaf,
  Map,
  MonitorCheck,
  PackageCheck,
  Plane,
  Radar,
  ShieldCheck,
  Sparkles,
  Sun,
  Waves,
  Zap
};

const ecosystemFallback = [
  ["Alektra EPC", "Solar EPC, hybrid systems, engineering, and project execution.", "/", "Sun", "EPC"],
  ["Alektra Thermal", "Drone-based thermal inspection, AI-assisted anomaly detection, and asset diagnostics.", "/thermal", "Radar", "Thermal"],
  ["Alektra Sparkle", "Professional solar panel cleaning for industrial and commercial systems.", "/sparkle", "Sparkles", "Sparkle"],
  ["Alektra Mapping", "Drone mapping, photogrammetry, LiDAR, and digital twin visualization.", "/mapping", "Map", "Mapping"]
];

export default async function HomePage() {
  const [impactRow, projects, page, heroMedia] = await Promise.all([
    prisma.impactSnapshot.findFirst({ orderBy: { createdAt: "desc" } }),
    prisma.project.findMany({
      where: { status: PublishStatus.PUBLISHED },
      select: {
        id: true,
        title: true,
        clientName: true,
        location: true,
        projectType: true,
        capacityKw: true,
        commissionedAt: true,
        coverImage: true,
        summary: true,
        inverterBrandModel: true,
        moduleBrandModel: true,
        slug: true,
        isFeatured: true,
        images: {
          select: { imagePath: true, altText: true },
          orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }],
          take: 1
        }
      },
      orderBy: [{ isFeatured: "desc" }, { commissionedAt: "desc" }, { createdAt: "desc" }],
      take: 24
    }),
    getPublishedPage(PageKey.epc),
    getPrimaryHeroMedia(PageKey.epc)
  ]);

  const hero = sectionByKey(page, "hero");
  const impactIntro = sectionByKey(page, "impact");
  const different = sectionByKey(page, "what-makes-us-different");
  const solutions = sectionByKey(page, "epc-solutions");
  const projectsSection = sectionByKey(page, "projects-showcase");
  const objectives = sectionByKey(page, "objectives");
  const ecosystem = sectionByKey(page, "ecosystem");
  const process = sectionByKey(page, "delivery-process");
  const quality = sectionByKey(page, "quality-trust");
  const proposalIntro = sectionByKey(page, "proposal-form");
  const faq = sectionByKey(page, "faq");
  const finalCta = sectionByKey(page, "final-cta");

  const heroSettings = settings(hero?.settingsJson, {
    kicker: "Solar EPC Excellence for Bangladesh's Industrial Future",
    primaryCtaText: "Explore Our EPC Solutions",
    primaryCtaLink: "#solutions",
    secondaryCtaText: "View Our Projects",
    secondaryCtaLink: "#projects",
    tertiaryCtaText: "Request a Proposal",
    tertiaryCtaLink: "#epc-proposal-form",
    trustBadges: ["C&I Solar EPC", "Hybrid & ESS Ready", "Thermal Inspection", "Sparkle Cleaning", "Mapping & Digital Twin"],
    posterImage: ""
  });

  const impact = {
    plantsInOperation: impactRow?.plantsInOperation ?? 0,
    totalInstalledCapacityKw: Number(impactRow?.totalInstalledCapacityKw ?? 0),
    kwhGenerated: Number(impactRow?.kwhGenerated ?? 0),
    equivalentTreesPlanted: Number(impactRow?.equivalentTreesPlanted ?? 0),
    co2OffsetTons: Number(impactRow?.co2OffsetTons ?? 0),
    longHaulFlightsAvoided: Number(impactRow?.longHaulFlightsAvoided ?? 0)
  };
  const projectCards = projects.map((project) => ({
    ...project,
    capacityKw: Number(project.capacityKw),
    commissionedAt: project.commissionedAt?.toISOString() ?? null
  }));

  return (
    <main className="epc-landing-page">
      <section className="epc-hero" id="epc">
        <div className="epc-hero-media-layer">
          <div className="epc-hero-fallback" />
          <HeroMediaBackground
            media={heroMedia}
            videoClassName="epc-hero-video"
            imageClassName="epc-hero-video"
            fallbackVideoSrc="/uploads/hero/epc/epc-hero-video.mp4"
            fallbackPosterImage={String(heroSettings.posterImage || "")}
          />
        </div>
        <div className="epc-hero-energy-lines" />
        <div className="epc-hero-overlay" />
        <div className="container epc-hero-inner">
          <div className="epc-hero-content epc-crystal-card">
            <p className="epc-kicker">{String(heroSettings.kicker)}</p>
            <h1>{hero?.title ?? "Alektra Renewable"}</h1>
            <h2>{hero?.subtitle ?? "Engineering Reliable Solar Energy Systems for Industries, Commercial Buildings, and Future-Ready Businesses"}</h2>
            <MarkdownBlock value={hero?.body ?? "Alektra Renewable delivers professional solar EPC solutions, hybrid energy systems, monitoring support, thermal inspection, cleaning, mapping, and long-term performance care for commercial and industrial clients. We combine engineering precision, premium components, advanced digital tools, and after-sales support to help businesses generate cleaner energy with confidence."} />
            <div className="epc-hero-actions">
              <a className="epc-btn primary" href={String(heroSettings.primaryCtaLink)}>{String(heroSettings.primaryCtaText)} <ArrowRight size={17} /></a>
              <a className="epc-btn secondary" href={String(heroSettings.secondaryCtaLink)}>{String(heroSettings.secondaryCtaText)}</a>
              <EpcProposalButton className="epc-btn ghost">{String(heroSettings.tertiaryCtaText)}</EpcProposalButton>
            </div>
            <div className="epc-trust-badges">
              {(heroSettings.trustBadges as string[]).map((badge) => <span key={badge}>{badge}</span>)}
            </div>
          </div>
        </div>
      </section>

      <div className="epc-impact-shell">
        <ImpactDashboard impact={impact} content={{ kicker: impactIntro?.subtitle, title: impactIntro?.title, body: impactIntro?.body }} />
      </div>

      <section className="epc-section" id="different">
        <div className="container">
          <EpcHeading section={different} fallbackKicker="Engineering Difference" fallbackTitle="What Makes Us Different">
            Beyond installation, Alektra Renewable protects your asset, your roof, your energy performance, and your long-term confidence.
          </EpcHeading>
          <div className="epc-card-grid three">
            {itemsOrFallback(different, differentFallback()).map((item) => <EpcFeatureCard item={item} key={item.title} />)}
          </div>
        </div>
      </section>

      <section className="epc-section epc-section-soft" id="solutions">
        <div className="container">
          <EpcHeading section={solutions} fallbackKicker="EPC Capabilities" fallbackTitle="Solar EPC Solutions Built for Performance">
            Practical engineering, quality procurement, careful installation, and long-term operating support for commercial and industrial clients.
          </EpcHeading>
          <div className="epc-capability-grid">
            {itemsOrFallback(solutions, solutionFallback()).map((item) => <EpcCapability item={item} key={item.title} />)}
          </div>
        </div>
      </section>

      <section className="epc-section" id="projects">
        <div className="container">
          <EpcHeading section={projectsSection} fallbackKicker="Featured Delivery" fallbackTitle="Our Projects">
            A premium project showcase connected to the existing project CMS. Published projects appear here automatically.
          </EpcHeading>
          {projectCards.length ? <EpcProjectShowcase projects={projectCards} /> : <EmptyProjects />}
        </div>
      </section>

      <section className="epc-section epc-section-soft" id="objectives">
        <div className="container">
          <EpcHeading section={objectives} fallbackKicker="Our Direction" fallbackTitle="Our Objectives">
            We are building Alektra Renewable to accelerate clean-energy adoption with engineering quality, responsible execution, and long-term client value.
          </EpcHeading>
          <div className="epc-card-grid four">
            {itemsOrFallback(objectives, objectiveFallback()).map((item) => <EpcFeatureCard item={item} key={item.title} large />)}
          </div>
        </div>
      </section>

      <section className="epc-section" id="ecosystem">
        <div className="container">
          <EpcHeading section={ecosystem} fallbackKicker="Alektra Ecosystem" fallbackTitle="One Renewable Energy Ecosystem">
            EPC delivery, thermal inspection, module cleaning, and mapping intelligence under one connected renewable-energy platform.
          </EpcHeading>
          <div className="epc-ecosystem-grid">
            {(ecosystem?.items.length ? ecosystem.items : ecosystemFallback.map(([title, body, linkUrl, icon, badge], index) => ({ title, body, linkUrl, icon, badge, sortOrder: index }))).map((item) => <EpcEcosystemCard item={item} key={item.title} />)}
          </div>
        </div>
      </section>

      <section className="epc-section epc-section-soft" id="process">
        <div className="container">
          <EpcHeading section={process} fallbackKicker="Project Discipline" fallbackTitle="How We Deliver Reliable Solar Projects">
            A structured project path helps reduce uncertainty and keeps commercial solar delivery accountable from concept to performance care.
          </EpcHeading>
          <div className="epc-process-rail">
            {itemsOrFallback(process, processFallback()).map((item, index) => <EpcProcessStep item={item} index={index} key={item.title} />)}
          </div>
        </div>
      </section>

      <section className="epc-section" id="quality">
        <div className="container epc-quality-shell epc-crystal-card">
          <div>
            <EpcHeading section={quality} fallbackKicker="Trust & Quality" fallbackTitle="Built Around Engineering, Safety, and Long-Term Performance">
              Engineering-first design, proper component selection, compliance-minded installation, roof protection, documentation, and long-term asset care.
            </EpcHeading>
            <div className="epc-quality-points">
              {itemsOrFallback(quality, qualityFallback()).map((item) => <EpcQualityPoint item={item} key={item.title} />)}
            </div>
          </div>
          <div className="epc-quality-orb">
            <ShieldCheck size={72} />
            <span>Engineering First</span>
          </div>
        </div>
      </section>

      <section className="epc-section epc-section-soft" id="epc-proposal-form">
        <div className="container">
          <EpcHeading section={proposalIntro} fallbackKicker="Proposal Request" fallbackTitle="Request a Solar EPC Proposal">
            Tell us about your facility and energy requirement. Our engineering team will review your information and contact you with the next steps.
          </EpcHeading>
          <EpcProposalForm />
        </div>
      </section>

      <section className="epc-section" id="faq">
        <div className="container">
          <EpcHeading section={faq} fallbackKicker="EPC FAQ" fallbackTitle="Solar EPC Questions">
            Clear answers for industrial and commercial clients evaluating solar EPC, hybrid energy systems, net metering, monitoring, and after-sales support.
          </EpcHeading>
          <div className="epc-faq-list">
            {itemsOrFallback(faq, faqFallback()).map((item, index) => <EpcFaqItem item={item} key={item.title} open={index === 0} />)}
          </div>
        </div>
      </section>

      <section className="epc-section epc-final-section" id="proposal">
        <div className="container">
          <div className="epc-final-cta epc-crystal-card">
            <p className="epc-kicker">{finalCta?.subtitle ?? "Start With Alektra"}</p>
            <h2>{finalCta?.title ?? "Ready to Build a Smarter Solar Energy System?"}</h2>
            <MarkdownBlock value={finalCta?.body ?? "Tell us about your facility, load profile, roof condition, and energy goals. Our team will help you evaluate the right solar solution for your business."} />
            <div className="epc-hero-actions">
              <EpcProposalButton className="epc-btn primary">Request a Proposal <ArrowRight size={17} /></EpcProposalButton>
              <a className="epc-btn secondary" href="mailto:contact@alektraepc.com">Contact Alektra Renewable</a>
              <Link className="epc-btn ghost" href="/company">Company & Careers</Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function EpcHeading({ section, fallbackKicker, fallbackTitle, children }: { section: ReturnType<typeof sectionByKey>; fallbackKicker: string; fallbackTitle: string; children: React.ReactNode }) {
  return (
    <div className="epc-section-heading">
      <div>
        <p className="epc-kicker">{section?.subtitle ?? fallbackKicker}</p>
        <h2>{section?.title ?? fallbackTitle}</h2>
      </div>
      <div><MarkdownBlock value={section?.body ?? String(children)} /></div>
    </div>
  );
}

function EpcFeatureCard({ item, large = false }: { item: CmsLikeItem; large?: boolean }) {
  const Icon = iconMap[item.icon as keyof typeof iconMap] ?? CheckCircle2;
  return (
    <article className={`epc-feature-card epc-crystal-card ${large ? "large" : ""}`}>
      <span className="epc-icon"><Icon size={26} /></span>
      <h3>{item.title}</h3>
      <p>{item.body}</p>
    </article>
  );
}

function EpcCapability({ item }: { item: CmsLikeItem }) {
  const Icon = iconMap[item.icon as keyof typeof iconMap] ?? CircuitBoard;
  return <article className="epc-capability epc-crystal-card"><Icon size={22} /><div><h3>{item.title}</h3><p>{item.body}</p></div></article>;
}

function EpcEcosystemCard({ item }: { item: CmsLikeItem }) {
  const Icon = iconMap[item.icon as keyof typeof iconMap] ?? Sun;
  return (
    <Link className={`epc-ecosystem-card epc-crystal-card accent-${String(item.badge ?? "epc").toLowerCase()}`} href={item.linkUrl ?? "/"}>
      <Icon size={28} />
      <span>{item.badge}</span>
      <h3>{item.title}</h3>
      <p>{item.body}</p>
    </Link>
  );
}

function EpcProcessStep({ item, index }: { item: CmsLikeItem; index: number }) {
  return <article className="epc-process-step"><span>{String(index + 1).padStart(2, "0")}</span><h3>{item.title}</h3><p>{item.body}</p></article>;
}

function EpcQualityPoint({ item }: { item: CmsLikeItem }) {
  const Icon = iconMap[item.icon as keyof typeof iconMap] ?? CheckCircle2;
  return <div><Icon size={18} /><span>{item.title}</span></div>;
}

function EpcFaqItem({ item, open = false }: { item: CmsLikeItem; open?: boolean }) {
  return (
    <details className="epc-faq-item epc-crystal-card" open={open}>
      <summary>
        <span>{item.title}</span>
        <strong>+</strong>
      </summary>
      <p>{item.body}</p>
    </details>
  );
}

type CmsLikeItem = {
  title: string;
  body?: string | null;
  icon?: string | null;
  linkUrl?: string | null;
  badge?: string | null;
};

function itemsOrFallback(section: ReturnType<typeof sectionByKey>, fallback: CmsLikeItem[]) {
  return section?.items.length ? section.items : fallback;
}

function EmptyProjects() {
  return <div className="epc-empty-projects epc-crystal-card"><h3>Project showcase is being prepared.</h3><p>Published projects from the admin project CMS will appear here automatically.</p></div>;
}

function differentFallback(): CmsLikeItem[] {
  return [
    { title: "We Care for Your Roof", body: "We prioritize roof protection and minimize unnecessary penetrations. Where anchoring is required, we follow proper waterproofing practices to help maintain roof integrity and support reliable, professional solar installation.", icon: "ShieldCheck" },
    { title: "Global Engineering Strength", body: "Our engineering capability is supported by experienced professionals and collaborators across borders for accurate design, better technical review, and high-quality execution.", icon: "Globe2" },
    { title: "Strong Monitoring Team", body: "Our monitoring team keeps a close eye on system performance so issues can be identified quickly through advanced manufacturer monitoring platforms.", icon: "MonitorCheck" },
    { title: "Quick Replacement Support", body: "In the event of eligible equipment failure, our support process helps clients raise replacement requests quickly and coordinate replacement units efficiently.", icon: "PackageCheck" },
    { title: "Complimentary Aerial Thermal Inspection", body: "Eligible clients receive 100% discount on aerial thermal inspection from Alektra Thermal for up to 3 years, including AI-assisted reporting and anomaly support.", icon: "Radar" },
    { title: "Complimentary Alektra Sparkle Cleaning", body: "Eligible clients receive 100% discount on professional solar panel cleaning from Alektra Sparkle, supporting performance and long-term asset care.", icon: "Droplets" }
  ];
}

function solutionFallback(): CmsLikeItem[] {
  return [
    { title: "Commercial & Industrial Rooftop Solar", body: "Structured solar EPC for factories, warehouses, commercial roofs, and operating facilities.", icon: "Building2" },
    { title: "Hybrid Solar & Energy Storage Systems", body: "Future-ready solar architectures with battery and energy storage readiness where suitable.", icon: "BatteryCharging" },
    { title: "Net Metering Support", body: "Documentation and technical coordination support for eligible net-metered solar projects.", icon: "Zap" },
    { title: "Electrical Design & Engineering", body: "Electrical layouts, component sizing, protection philosophy, and performance-focused design review.", icon: "CircuitBoard" },
    { title: "Procurement & Quality Components", body: "Component selection aligned with warranty, service support, project conditions, and lifecycle value.", icon: "Boxes" },
    { title: "Installation, Testing & Commissioning", body: "Field execution with safety supervision, testing discipline, handover documentation, and commissioning care.", icon: "CheckCircle2" },
    { title: "Remote Monitoring & O&M Support", body: "Monitoring support and performance follow-up for dependable long-term operation.", icon: "MonitorCheck" },
    { title: "Performance Analytics & Reporting", body: "Operating insight through production data, reporting, inspection, cleaning, and mapping services.", icon: "FileText" }
  ];
}

function objectiveFallback(): CmsLikeItem[] {
  return [
    { title: "Promote Renewable Energy Adoption", body: "Our primary objective is to accelerate the adoption of renewable energy, particularly solar energy, in Bangladesh.", icon: "Sun" },
    { title: "Set New Standards of Quality", body: "We strive to establish a benchmark of excellence through sound engineering practices, advanced technology, quality components, and customer-focused delivery.", icon: "Award" },
    { title: "Support Energy Independence", body: "We help clients reduce reliance on conventional power sources with reliable and efficient solar solutions.", icon: "BatteryCharging" },
    { title: "Foster Environmental Stewardship", body: "Through wider adoption of solar energy, we aim to reduce emissions, support climate action, and contribute to a greener future.", icon: "Leaf" }
  ];
}

function processFallback(): CmsLikeItem[] {
  return [
    { title: "Requirement Review", body: "We understand energy goals, operating context, roof condition, and project constraints." },
    { title: "Site Assessment & Data Collection", body: "Site information, load profile, structural considerations, and utility details are collected." },
    { title: "Engineering Design", body: "The technical solution is designed around safety, yield, accessibility, and lifecycle performance." },
    { title: "Proposal & Financial Evaluation", body: "Clients receive a clear technical and commercial view for decision-making." },
    { title: "Procurement & Quality Control", body: "Major components are selected and coordinated around project specifications and support." },
    { title: "Installation & Safety Supervision", body: "Field work is supervised with attention to roof protection, electrical safety, and execution quality." },
    { title: "Testing, Commissioning & Handover", body: "The system is tested, commissioned, documented, and handed over with operating clarity." },
    { title: "Monitoring, Support & Performance Care", body: "Long-term care is supported through monitoring, inspection, cleaning, mapping, and reporting." }
  ];
}

function qualityFallback(): CmsLikeItem[] {
  return [
    { title: "Engineering-first design", icon: "CircuitBoard" },
    { title: "Proper component selection", icon: "Boxes" },
    { title: "Compliance-minded installation", icon: "ShieldCheck" },
    { title: "Monitoring and after-sales support", icon: "MonitorCheck" },
    { title: "Roof protection and waterproofing care", icon: "Droplets" },
    { title: "Documentation and reporting", icon: "FileText" },
    { title: "Long-term asset care through Alektra divisions", icon: "Sparkles" }
  ];
}

function faqFallback(): CmsLikeItem[] {
  return [
    { title: "What type of solar projects does Alektra Renewable handle?", body: "Alektra Renewable focuses on commercial, industrial, institutional, rooftop, and selected larger solar energy projects where structured engineering and long-term support are important." },
    { title: "Do you work with industrial and commercial rooftop solar systems?", body: "Yes. Industrial and commercial rooftop systems are a core part of our EPC work, including design, procurement, installation, commissioning, monitoring, and after-sales support." },
    { title: "Can you design hybrid solar and energy storage systems?", body: "Yes. We can evaluate hybrid solar and energy storage readiness based on load profile, backup requirement, site condition, budget, and operating objective." },
    { title: "Do you support net metering applications?", body: "We can support technical documentation and coordination for eligible net metering projects, subject to applicable rules, utility requirements, and site feasibility." },
    { title: "What information is needed for a solar proposal?", body: "Useful information includes facility location, roof or land area, electricity bills or consumption data, transformer and load details, desired system type, and any site constraints." },
    { title: "How do you protect the roof during installation?", body: "Our installation planning considers roof integrity, drainage, waterproofing, access, and suitable mounting practices. Where anchoring is required, proper waterproofing procedures are followed." },
    { title: "Do you provide monitoring and after-sales support?", body: "Yes. We support monitoring, performance follow-up, issue coordination, and long-term asset care through EPC support and Alektra divisions such as Thermal, Sparkle, and Mapping." },
    { title: "What brands of inverters and panels do you work with?", body: "Brand selection depends on project requirements, availability, warranty, technical compatibility, service support, and client preference. We prioritize reliable components suited to the project context." },
    { title: "Do you provide thermal inspection and cleaning support?", body: "Eligible clients may receive support from Alektra Thermal for aerial thermal inspection and Alektra Sparkle for professional solar panel cleaning, subject to project scope and terms." },
    { title: "How long does a typical EPC project take?", body: "Timeline depends on system size, site readiness, design approval, procurement, utility coordination, weather, and access conditions. Our team provides a project-specific schedule after review." }
  ];
}
