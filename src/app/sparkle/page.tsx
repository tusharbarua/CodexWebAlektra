import {
  BarChart3,
  Building2,
  CalendarCheck,
  Check,
  ClipboardCheck,
  Droplets,
  Factory,
  FileSearch,
  Gauge,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
  Users,
  Waves,
  Wrench
} from "lucide-react";
import { PageKey } from "@prisma/client";
import { HeroMediaBackground } from "@/components/HeroMediaBackground";
import { SparkleDropletOverlay } from "@/components/SparkleDropletOverlay";
import { SparkleServiceForm } from "@/components/SparkleServiceForm";
import { getPrimaryHeroMedia } from "@/lib/hero-media";
import { MarkdownBlock, getPublishedPage, sectionByKey, settings } from "@/lib/page-cms";

export const dynamic = "force-dynamic";

const iconMap = {
  BarChart3,
  Building2,
  CalendarCheck,
  Check,
  ClipboardCheck,
  Droplets,
  Factory,
  FileSearch,
  Gauge,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
  Users,
  Waves,
  Wrench
};

export async function generateMetadata() {
  const page = await getPublishedPage(PageKey.sparkle);
  return {
    title: page?.metaTitle ?? "Alektra Sparkle | Solar Panel Cleaning Service",
    description: page?.metaDescription ?? "Professional solar panel cleaning for industrial and commercial rooftop systems."
  };
}

export default async function SparklePage() {
  const [page, sparkleHeroMedia] = await Promise.all([
    getPublishedPage(PageKey.sparkle),
    getPrimaryHeroMedia(PageKey.sparkle)
  ]);
  const hero = sectionByKey(page, "hero");
  const heroSettings = settings(hero?.settingsJson, {
    kicker: "Industrial Solar Cleaning Excellence",
    primaryCtaText: "Request Service",
    primaryCtaLink: "#request",
    secondaryCtaText: "Why Cleaning Matters",
    secondaryCtaLink: "#why-cleaning",
    minimumNote: "Minimum Sparkle service request size:",
    minimumValue: "200 kWp",
    posterImage: ""
  });
  const why = sectionByKey(page, "why-cleaning");
  const visualData = sectionByKey(page, "visual-data");
  const myth = sectionByKey(page, "rain-myth");
  const services = sectionByKey(page, "services");
  const workflow = sectionByKey(page, "workflow");
  const request = sectionByKey(page, "request-form");
  const faq = sectionByKey(page, "faq");
  const mythSettings = settings(myth?.settingsJson, { mythTitle: "Rain washes everything away.", realityTitle: "Professional cleaning is still necessary." });

  return (
    <main className="sparkle-page">
      {hero ? (
        <section className="sparkle-hero">
          <HeroMediaBackground
            media={sparkleHeroMedia}
            videoClassName="sparkle-hero-video"
            imageClassName="sparkle-hero-video"
            fallbackVideoSrc="/uploads/hero/sparkle/sparkle-hero-video.mp4"
            fallbackPosterImage={String(heroSettings.posterImage || "")}
          />
          <div className="sparkle-hero-fallback" />
          <div className="sparkle-hero-overlay" />
          <SparkleDropletOverlay />
          <div className="container sparkle-hero-content">
            <p className="sparkle-kicker">{String(heroSettings.kicker)}</p>
            <h1>{hero.title}</h1>
            {hero.subtitle ? <h2>{hero.subtitle}</h2> : null}
            <p>{hero.body}</p>
            <div className="sparkle-actions">
              <a className="sparkle-primary-button" href={String(heroSettings.primaryCtaLink)}>{String(heroSettings.primaryCtaText)}</a>
              <a className="sparkle-secondary-button" href={String(heroSettings.secondaryCtaLink)}>{String(heroSettings.secondaryCtaText)}</a>
            </div>
            <div className="sparkle-minimum">{String(heroSettings.minimumNote)} <strong>{String(heroSettings.minimumValue)}</strong></div>
          </div>
        </section>
      ) : null}

      {why ? (
        <section className="sparkle-section" id="why-cleaning">
          <div className="container">
            <SparkleHeading kicker={why.subtitle ?? ""} title={why.title}>{why.body}</SparkleHeading>
            <div className="sparkle-card-grid">
              {why.items.map((item) => <SparkleCard item={item} key={item.id} />)}
            </div>
          </div>
        </section>
      ) : null}

      {visualData ? (
        <section className="sparkle-section sparkle-data-section">
          <div className="container sparkle-data-layout">
            <div>
              <SparkleHeading kicker={visualData.subtitle ?? ""} title={visualData.title}>{visualData.body}</SparkleHeading>
              <div className="sparkle-before-after">
                <div><span>Soiled</span><p>Reduced irradiance, patchy deposits, harder diagnosis.</p></div>
                <div><span>Clean</span><p>Clearer glass surface, stronger yield reference, better presentation.</p></div>
              </div>
            </div>
            <div className="sparkle-glass sparkle-bar-card">
              {visualData.items.map((item) => {
                const itemSettings = settings(item.settingsJson, { bar: 80 });
                const bar = Math.max(8, Math.min(100, Number(itemSettings.bar) || 80));
                return (
                  <div className="sparkle-bar-row" key={item.id}>
                    <div><strong>{item.title}</strong><span>{item.body}</span></div>
                    <em>{item.badge}</em>
                    <i style={{ width: `${bar}%` }} />
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      ) : null}

      {myth ? (
        <section className="sparkle-section sparkle-myth-section">
          <div className="container">
            <SparkleHeading kicker={myth.subtitle ?? ""} title={myth.title}>{myth.body}</SparkleHeading>
            <div className="sparkle-myth-grid">
              <article className="sparkle-glass myth-card myth"><CloudRainIcon /><span>Myth</span><h3>{String(mythSettings.mythTitle)}</h3></article>
              <article className="sparkle-glass myth-card reality"><Sparkles size={30} /><span>Reality</span><h3>{String(mythSettings.realityTitle)}</h3></article>
            </div>
            <div className="sparkle-card-grid compact">
              {myth.items.map((item) => <SparkleCard item={item} key={item.id} />)}
            </div>
          </div>
        </section>
      ) : null}

      {services ? (
        <section className="sparkle-section">
          <div className="container">
            <SparkleHeading kicker={services.subtitle ?? ""} title={services.title}>{services.body}</SparkleHeading>
            <div className="sparkle-service-grid">
              {services.items.map((item) => <SparkleCard item={item} key={item.id} />)}
            </div>
          </div>
        </section>
      ) : null}

      {workflow ? (
        <section className="sparkle-section sparkle-workflow-section">
          <div className="container">
            <SparkleHeading kicker={workflow.subtitle ?? ""} title={workflow.title}>{workflow.body}</SparkleHeading>
            <div className="sparkle-workflow">
              {workflow.items.map((item, index) => {
                const Icon = iconMap[item.icon as keyof typeof iconMap] ?? Droplets;
                return <article className="sparkle-workflow-step sparkle-glass" key={item.id}><span>{item.badge ?? index + 1}</span><Icon size={24} /><h3>{item.title}</h3><p>{item.body}</p></article>;
              })}
            </div>
          </div>
        </section>
      ) : null}

      {request ? (
        <section className="sparkle-section sparkle-request-section" id="request">
          <div className="container">
            <SparkleHeading kicker={request.subtitle ?? ""} title={request.title}>{request.body}</SparkleHeading>
            <div className="sparkle-form-shell sparkle-glass">
              <SparkleServiceForm />
            </div>
          </div>
        </section>
      ) : null}

      {faq ? (
        <section className="sparkle-section sparkle-faq">
          <div className="container">
            <SparkleHeading kicker={faq.subtitle ?? ""} title={faq.title}>{faq.body}</SparkleHeading>
            <div className="faq-list sparkle-faq-list">
              {faq.items.map((item) => <details key={item.id}><summary>{item.title}</summary><MarkdownBlock value={item.body} /></details>)}
            </div>
          </div>
        </section>
      ) : null}
    </main>
  );
}

function SparkleHeading({ kicker, title, children }: { kicker: string; title: string; children: React.ReactNode }) {
  return <div className="sparkle-heading"><div><p className="sparkle-kicker">{kicker}</p><h2>{title}</h2></div><p>{children}</p></div>;
}

function SparkleCard({ item }: { item: { title: string; body: string | null; icon: string | null } }) {
  const Icon = iconMap[item.icon as keyof typeof iconMap] ?? Droplets;
  return <article className="sparkle-card sparkle-glass"><Icon size={24} /><h3>{item.title}</h3><p>{item.body}</p></article>;
}

function CloudRainIcon() {
  return <Waves size={30} />;
}
