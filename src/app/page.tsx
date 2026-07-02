import { PageKey, PublishStatus } from "@prisma/client";
import Link from "next/link";
import { ArrowRight, BatteryCharging, Download, Play, ShieldCheck } from "lucide-react";
import { ContactForm } from "@/components/ContactForm";
import { ImpactDashboard } from "@/components/ImpactDashboard";
import { HeroMediaBackground } from "@/components/HeroMediaBackground";
import { ProductCard } from "@/components/ProductCard";
import { SubdivisionTabs } from "@/components/SubdivisionTabs";
import { brochureEnergyRows, whyChoose } from "@/data/site";
import { money, numberFormat } from "@/lib/format";
import { getPrimaryHeroMedia } from "@/lib/hero-media";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [impactRow, projects, articles, resourceCategories, products, contentRows, heroMedia] = await Promise.all([
    prisma.impactSnapshot.findFirst({ orderBy: { createdAt: "desc" } }),
    prisma.project.findMany({ where: { status: PublishStatus.PUBLISHED }, orderBy: { commissionedAt: "desc" }, take: 6 }),
    prisma.resourceArticle.findMany({
      where: { status: PublishStatus.PUBLISHED },
      include: { category: true },
      orderBy: { publishedAt: "desc" },
      take: 6
    }),
    prisma.resourceCategory.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }] }),
    prisma.product.findMany({
      where: { status: PublishStatus.PUBLISHED, isFeatured: true },
      include: { category: true, images: { orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }] } },
      take: 3
    }),
    prisma.siteContent.findMany({ where: { status: PublishStatus.PUBLISHED } }),
    getPrimaryHeroMedia(PageKey.epc)
  ]);
  const content = new Map(contentRows.map((item) => [item.key, item]));
  const totalSavings = brochureEnergyRows.reduce((sum, row) => sum + Number(row[5]), 0);
  const impact = {
    plantsInOperation: impactRow?.plantsInOperation ?? 0,
    totalInstalledCapacityKw: Number(impactRow?.totalInstalledCapacityKw ?? 0),
    kwhGenerated: Number(impactRow?.kwhGenerated ?? 0),
    equivalentTreesPlanted: Number(impactRow?.equivalentTreesPlanted ?? 0),
    co2OffsetTons: Number(impactRow?.co2OffsetTons ?? 0),
    longHaulFlightsAvoided: Number(impactRow?.longHaulFlightsAvoided ?? 0)
  };

  return (
    <main>
      <section className={`hero ${heroMedia ? "has-hero-media" : ""}`}>
        <HeroMediaBackground media={heroMedia} />
        <div className="container hero-content">
          <span className="eyebrow">Alektra EPC | Bangladesh Solar Engineering</span>
          <h1>Alektra Renewable</h1>
          <p>Premium solar EPC for industrial and commercial roofs, supported by inspection, cleaning and mapping.</p>
          <div className="hero-actions">
            <a className="btn" href="#contact">Start a project <ArrowRight size={18} /></a>
            <Link className="btn secondary" href="/shop">Visit shop</Link>
          </div>
        </div>
      </section>

      <section className="section" id="epc">
        <div className="container intro-grid">
          <div className="visual-band" />
          <div className="panel">
            <p className="kicker">Company Introduction</p>
            <h2>{content.get("company-introduction")?.title ?? "Solar EPC built for serious energy users."}</h2>
            <p>{content.get("company-introduction")?.body}</p>
          </div>
        </div>
      </section>

      <ImpactDashboard impact={impact} />

      <section className="section soft" id="projects">
        <div className="container">
          <SectionHeading kicker="Completed Projects" title="Commercial-grade delivery across solar and asset care.">
            Explore selected installations and technical services delivered for commercial and industrial energy users.
          </SectionHeading>
          <div className="card-grid">
            {projects.map((project) => (
              <article className="card" key={project.id}>
                <div className="card-media" style={{ backgroundImage: `url(${project.coverImage ?? fallbackSolar})` }} />
                <div className="card-body">
                  <small>{project.location} | {numberFormat(Number(project.capacityKw))} kW</small>
                  <h3>{project.title}</h3>
                  <p>{project.summary}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {projects.some((project) => project.videoUrl) ? (
        <section className="section" id="videos">
          <div className="container">
            <SectionHeading kicker="Project Videos" title="See Alektra's work in action.">
              Installation, commissioning and inspection stories from the field.
            </SectionHeading>
            <div className="card-grid">
              {projects.filter((project) => project.videoUrl).map((project) => (
                <a className="card" href={project.videoUrl!} target="_blank" rel="noreferrer" key={project.id}>
                  <div className="card-media" style={{ backgroundImage: `url(${project.coverImage ?? fallbackSolar})` }} />
                  <div className="card-body"><Play size={24} /><h3>{project.title}</h3><p>{project.summary}</p></div>
                </a>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section className="section soft">
        <div className="container">
          <SectionHeading kicker="Mission & Vision" title="Clean power with disciplined engineering.">
            Helping suitable roofs and land assets generate cleaner, more economical electricity.
          </SectionHeading>
          <div className="intro-grid">
            <div className="panel"><BatteryCharging size={30} /><h2>{content.get("mission")?.title ?? "Mission"}</h2><p>{content.get("mission")?.body}</p></div>
            <div className="panel"><ShieldCheck size={30} /><h2>{content.get("vision")?.title ?? "Vision"}</h2><p>{content.get("vision")?.body}</p></div>
          </div>
        </div>
      </section>

      <section className="section" id="subdivisions">
        <div className="container">
          <SectionHeading kicker="Alektra Subdivisions" title="One renewable platform, four specialist teams.">
            EPC delivery, aerial thermal inspection, panel cleaning and digital mapping under one trusted brand.
          </SectionHeading>
          <SubdivisionTabs />
        </div>
      </section>

      <section className="section soft">
        <div className="container">
          <SectionHeading kicker="Why Choose Alektra" title="Built for yield, accountability and long-term care.">
            Engineering and field services designed around dependable performance throughout the life of a solar asset.
          </SectionHeading>
          <div className="split-list">{whyChoose.map((reason) => <div className="reason" key={reason}>{reason}</div>)}</div>
        </div>
      </section>

      <section className="section" id="resources">
        <div className="container">
          <SectionHeading kicker="Resource & Learning Area" title="Practical solar knowledge for owners and engineers.">
            Build a stronger understanding of equipment, design choices, operating performance and solar economics.
          </SectionHeading>
          <div className="category-strip">{resourceCategories.map((category) => <span key={category.id}>{category.name}</span>)}</div>
          <div className="resource-grid">
            {articles.map((article) => (
              <Link className="card" href={`/resources/${article.slug}`} key={article.id}>
                {article.coverImage ? <div className="card-media" style={{ backgroundImage: `url(${article.coverImage})` }} /> : null}
                <div className="card-body"><small>{article.category.name}</small><h3>{article.title}</h3><p>{article.excerpt}</p></div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section soft" id="economics">
        <div className="container">
          <SectionHeading kicker="Energy, Economy, Environment" title="A clearer view of solar savings.">
            The brochure model estimates annual usage of 466,533 kWh and annual savings of {money(totalSavings)}.
          </SectionHeading>
          <div className="panel" style={{ overflowX: "auto" }}>
            <table className="table">
              <thead><tr><th>Month</th><th>Solar kWh</th><th>Consumption kWh</th><th>Before solar</th><th>After solar</th><th>Estimated savings</th></tr></thead>
              <tbody>{brochureEnergyRows.map((row) => <tr key={row[0]}><td>{row[0]}</td><td>{numberFormat(Number(row[1]))}</td><td>{numberFormat(Number(row[2]))}</td><td>{money(Number(row[3]))}</td><td>{money(Number(row[4]))}</td><td>{money(Number(row[5]))}</td></tr>)}</tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <SectionHeading kicker="Solar Shop" title="Equipment selected for dependable performance.">
            Source solar modules, inverters, mounting hardware and monitoring accessories.
          </SectionHeading>
          <div className="shop-grid">
            {products.map((product) => <ProductCard key={product.id} product={{
              name: product.name, slug: product.slug, sku: product.sku, category: product.category.name,
              price: Number(product.priceBdt), stock: product.stockQuantity,
              image: product.images[0]?.imagePath ?? fallbackSolar, description: product.shortDescription
            }} />)}
          </div>
          <p style={{ marginTop: 24 }}><Link className="btn secondary" href="/shop">Browse all products <ArrowRight size={18} /></Link></p>
        </div>
      </section>

      <section className="section dark" id="contact">
        <div className="container contact-shell">
          <div>
            <p className="kicker">Contact</p>
            <h2>Plan a solar plant or support an operating asset.</h2>
            <p style={{ color: "rgba(255,255,255,.72)" }}>Share your roof type, load profile, site address or inspection need.</p>
            <p><a className="btn secondary" href="mailto:info@alektraepc.com"><Download size={18} />Request brochure</a></p>
          </div>
          <ContactForm />
        </div>
      </section>
    </main>
  );
}

const fallbackSolar = "https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&w=1200&q=80";

function SectionHeading({ kicker, title, children }: { kicker: string; title: string; children: React.ReactNode }) {
  return <div className="section-heading"><div><p className="kicker">{kicker}</p><h2>{title}</h2></div><p>{children}</p></div>;
}
