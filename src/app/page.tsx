import Link from "next/link";
import { ArrowRight, BatteryCharging, Download, Play, ShieldCheck } from "lucide-react";
import { ContactForm } from "@/components/ContactForm";
import { ImpactDashboard } from "@/components/ImpactDashboard";
import { ProductCard } from "@/components/ProductCard";
import { SubdivisionTabs } from "@/components/SubdivisionTabs";
import { brochureEnergyRows, learningArticles, products, projects, resourceCategories, whyChoose } from "@/data/site";
import { money, numberFormat } from "@/lib/format";

export default function HomePage() {
  const totalSavings = brochureEnergyRows.reduce((sum, row) => sum + Number(row[5]), 0);

  return (
    <main>
      <section className="hero">
        <div className="container hero-content">
          <span className="eyebrow">Alektra EPC · Bangladesh Solar Engineering</span>
          <h1>Alektra Renewable</h1>
          <p>
            Premium solar EPC for industrial and commercial roofs, supported by thermal inspection, panel cleaning,
            photogrammetry and digital mapping services.
          </p>
          <div className="hero-actions">
            <a className="btn" href="#contact">
              Start a project <ArrowRight size={18} />
            </a>
            <Link className="btn secondary" href="/shop">
              Visit shop
            </Link>
          </div>
        </div>
      </section>

      <section className="section" id="epc">
        <div className="container intro-grid">
          <div className="visual-band" />
          <div className="panel">
            <p className="kicker">Company Introduction</p>
            <h2>Solar EPC built for serious energy users.</h2>
            <p>
              Alektra EPC designs, engineers, procures, installs and commissions rooftop, industrial and commercial solar
              plants for businesses that want reliable energy, lower operating costs and measurable environmental gains.
            </p>
            <p>
              The workflow covers feasibility, utility coordination, net metering, monitoring, handover and long-term
              performance care. Alektra Thermal, Sparkle and Mapping extend that care across inspection, cleaning and
              digital survey services.
            </p>
          </div>
        </div>
      </section>

      <ImpactDashboard />

      <section className="section soft" id="projects">
        <div className="container">
          <div className="section-heading">
            <div>
              <p className="kicker">Completed Projects</p>
              <h2>Commercial-grade delivery across solar, inspection and asset care.</h2>
            </div>
            <p>
              Project records are admin-managed and ready for case-study expansion with capacity, savings, images,
              videos and commissioning details.
            </p>
          </div>
          <div className="card-grid">
            {projects.map((project) => (
              <article className="card" key={project.title}>
                <div className="card-media" style={{ backgroundImage: `url(${project.image})` }} />
                <div className="card-body">
                  <small>{project.location} · {project.capacity}</small>
                  <h3>{project.title}</h3>
                  <p>{project.summary}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section" id="videos">
        <div className="container">
          <div className="section-heading">
            <div>
              <p className="kicker">Videos</p>
              <h2>Project films, inspection reels and product explainers.</h2>
            </div>
            <p>
              Admin can replace these video cards with hosted project films, YouTube embeds or self-hosted hero media.
            </p>
          </div>
          <div className="card-grid">
            {["Rooftop EPC Walkthrough", "Thermal Inspection Flight", "Panel Cleaning Workflow"].map((title) => (
              <article className="card" key={title}>
                <div className="card-media" style={{ backgroundImage: "url(https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?auto=format&fit=crop&w=1200&q=80)" }} />
                <div className="card-body">
                  <Play size={24} />
                  <h3>{title}</h3>
                  <p>Video content is managed from the protected admin dashboard.</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section soft">
        <div className="container">
          <div className="section-heading">
            <div>
              <p className="kicker">Mission & Vision</p>
              <h2>Clean power with disciplined engineering.</h2>
            </div>
            <p>
              Alektra Renewable exists to help every suitable roof and land asset generate cleaner, more economical
              electricity.
            </p>
          </div>
          <div className="intro-grid">
            <div className="panel">
              <BatteryCharging size={30} />
              <h2>Mission</h2>
              <p>
                Accelerate clean-energy adoption in Bangladesh by delivering dependable solar EPC, inspection, cleaning
                and mapping services with transparent project execution.
              </p>
            </div>
            <div className="panel">
              <ShieldCheck size={30} />
              <h2>Vision</h2>
              <p>
                Become a trusted renewable-energy partner for commercial and industrial clients across the full lifecycle
                of solar assets.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="section" id="subdivisions">
        <div className="container">
          <div className="section-heading">
            <div>
              <p className="kicker">Alektra Subdivisions</p>
              <h2>One renewable platform, four specialist teams.</h2>
            </div>
            <p>
              The landing page leads with Alektra EPC while keeping Thermal, Sparkle and Mapping visible for clients
              managing solar assets after commissioning.
            </p>
          </div>
          <SubdivisionTabs />
        </div>
      </section>

      <section className="section soft">
        <div className="container">
          <div className="section-heading">
            <div>
              <p className="kicker">Why Choose Alektra</p>
              <h2>Built for yield, accountability and long-term care.</h2>
            </div>
            <p>
              Alektra’s operating model connects engineering, procurement, commissioning, monitoring, cleaning, thermal
              inspection and mapping.
            </p>
          </div>
          <div className="split-list">
            {whyChoose.map((reason) => (
              <div className="reason" key={reason}>
                {reason}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section" id="resources">
        <div className="container">
          <div className="section-heading">
            <div>
              <p className="kicker">Resource & Learning Area</p>
              <h2>Practical solar knowledge for owners and engineers.</h2>
            </div>
            <p>
              Admins can create, edit, publish, unpublish and delete articles across panels, inverters, mounting,
              cables, net metering, monitoring, ESS and economics.
            </p>
          </div>
          <div className="category-strip">
            {resourceCategories.map((category) => (
              <span key={category}>{category}</span>
            ))}
          </div>
          <div className="resource-grid">
            {learningArticles.map((article) => (
              <Link className="card" href={`/resources/${article.slug}`} key={article.slug}>
                <div className="card-body">
                  <small>{article.category}</small>
                  <h3>{article.title}</h3>
                  <p>{article.excerpt}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section soft" id="economics">
        <div className="container">
          <div className="section-heading">
            <div>
              <p className="kicker">Energy, Economy, Environment</p>
              <h2>Brochure-based savings model.</h2>
            </div>
            <p>
              The extracted brochure page models 466,533 kWh annual usage, 3.0% annual energy-cost escalation and
              estimated annual savings of {money(totalSavings)}.
            </p>
          </div>
          <div className="panel" style={{ overflowX: "auto" }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Month</th>
                  <th>Solar kWh</th>
                  <th>Consumption kWh</th>
                  <th>Before solar</th>
                  <th>After solar</th>
                  <th>Estimated savings</th>
                </tr>
              </thead>
              <tbody>
                {brochureEnergyRows.map((row) => (
                  <tr key={row[0]}>
                    <td>{row[0]}</td>
                    <td>{numberFormat(Number(row[1]))}</td>
                    <td>{numberFormat(Number(row[2]))}</td>
                    <td>{money(Number(row[3]))}</td>
                    <td>{money(Number(row[4]))}</td>
                    <td>{money(Number(row[5]))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-heading">
            <div>
              <p className="kicker">E-commerce</p>
              <h2>Solar products, accessories and technical documentation.</h2>
            </div>
            <p>
              Product listing, categories, details, stock, SKU, related products, cart, checkout, coupons, delivery
              charges, COD, SSLCommerz and admin order management are included.
            </p>
          </div>
          <div className="shop-grid">
            {products.filter((product) => product.featured).map((product) => (
              <ProductCard product={product} key={product.slug} />
            ))}
          </div>
          <p style={{ marginTop: 24 }}>
            <Link className="btn secondary" href="/shop">
              Browse all products <ArrowRight size={18} />
            </Link>
          </p>
        </div>
      </section>

      <section className="section dark" id="contact">
        <div className="container contact-shell">
          <div>
            <p className="kicker">Contact</p>
            <h2>Plan a solar plant or support an operating asset.</h2>
            <p style={{ color: "rgba(255,255,255,.72)" }}>
              Share your roof type, load profile, site address or inspection need. Alektra can respond with EPC,
              Thermal, Sparkle or Mapping support.
            </p>
            <p>
              <a className="btn secondary" href="mailto:info@alektraepc.com">
                <Download size={18} />
                Request brochure
              </a>
            </p>
          </div>
          <ContactForm />
        </div>
      </section>
    </main>
  );
}
