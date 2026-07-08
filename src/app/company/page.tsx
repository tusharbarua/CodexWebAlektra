import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BriefcaseBusiness, Compass, HeartHandshake, Leaf, Target } from "lucide-react";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Company",
  description: "About Alektra Renewable, our mission, vision, values, divisions, and careers.",
  alternates: { canonical: "/company" }
};

export default async function CompanyPage() {
  const rows = await prisma.siteContent.findMany({ where: { key: { in: ["mission", "vision", "company-introduction"] } } }).catch(() => []);
  const content = new Map(rows.map((row) => [row.key, row]));
  return (
    <main className="company-page">
      <section className="company-hero">
        <div className="container company-hero-card epc-crystal-card">
          <p className="epc-kicker">About Alektra Renewable</p>
          <h1>Engineering clean-energy confidence for Bangladesh.</h1>
          <p>{content.get("company-introduction")?.body ?? "Alektra Renewable delivers solar EPC, inspection, cleaning, mapping, and long-term renewable-energy support for commercial and industrial clients."}</p>
          <Link className="epc-btn primary" href="/#proposal">Request a Proposal <ArrowRight size={17} /></Link>
        </div>
      </section>

      <section className="epc-section">
        <div className="container company-grid">
          <article className="epc-feature-card epc-crystal-card">
            <span className="epc-icon"><Target size={28} /></span>
            <h2>{content.get("mission")?.title ?? "Mission"}</h2>
            <p>{content.get("mission")?.body ?? "To accelerate renewable-energy adoption through dependable engineering, responsible execution, and long-term client care."}</p>
          </article>
          <article className="epc-feature-card epc-crystal-card">
            <span className="epc-icon"><Compass size={28} /></span>
            <h2>{content.get("vision")?.title ?? "Vision"}</h2>
            <p>{content.get("vision")?.body ?? "To become a trusted renewable-energy platform for Bangladesh's commercial and industrial energy future."}</p>
          </article>
        </div>
      </section>

      <section className="epc-section epc-section-soft">
        <div className="container">
          <div className="epc-section-heading">
            <div><p className="epc-kicker">Values</p><h2>How we want to build.</h2></div>
            <p>Our work is guided by engineering discipline, transparency, safety, and long-term responsibility.</p>
          </div>
          <div className="epc-card-grid four">
            {[
              { title: "Engineering Discipline", body: "We prioritize practical design, suitable components, and careful execution.", Icon: Target },
              { title: "Client Responsibility", body: "We communicate clearly and support clients beyond installation.", Icon: HeartHandshake },
              { title: "Environmental Care", body: "We help businesses reduce emissions with practical clean-energy systems.", Icon: Leaf },
              { title: "Professional Growth", body: "We build teams that keep learning, improving, and solving real problems.", Icon: BriefcaseBusiness }
            ].map(({ title, body, Icon }) => (
              <article className="epc-feature-card epc-crystal-card" key={title}>
                <span className="epc-icon"><Icon size={26} /></span>
                <h3>{title}</h3>
                <p>{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="epc-section">
        <div className="container epc-final-cta epc-crystal-card">
          <p className="epc-kicker">Careers</p>
          <h2>Careers at Alektra Renewable</h2>
          <p>We are building a team of engineers, technicians, designers, analysts, and renewable-energy professionals who want to shape Bangladesh&apos;s clean-energy future.</p>
          <a className="epc-btn primary" href="mailto:contact@alektraepc.com">Send your CV to contact@alektraepc.com <ArrowRight size={17} /></a>
        </div>
      </section>
    </main>
  );
}
