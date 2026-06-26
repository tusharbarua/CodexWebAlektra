import { ArrowDown, Check, ClipboardCheck, Crosshair, FileSearch, Plane, ScanLine } from "lucide-react";
import { ThermalAnomalyGrid } from "@/components/ThermalAnomalyGrid";
import { ThermalInspectionForm } from "@/components/ThermalInspectionForm";
import { comprehensivePoints, standardPoints } from "@/data/thermal";

export const metadata = {
  title: "Alektra Thermal | Aerial Thermal Inspection for Solar PV Plants",
  description: "Drone-based infrared and RGB inspection for rooftop and ground-mounted solar PV plants."
};

export default function ThermalPage() {
  return <main className="thermal-page">
    <section className="thermal-hero">
      <video className="thermal-hero-video" autoPlay muted loop playsInline poster="https://images.unsplash.com/photo-1508614589041-895b88991e3e?auto=format&fit=crop&w=1800&q=80">
        <source src="/videos/thermal-drone.mp4" type="video/mp4" />
      </video>
      <div className="thermal-hero-overlay" />
      <div className="thermal-atmosphere" />
      <div className="container thermal-hero-content">
        <p className="thermal-kicker">Drone-based IR + RGB intelligence</p><h1>Alektra Thermal</h1>
        <h2>Aerial Thermal Inspection for Solar PV Plants</h2>
        <p>Detect hidden faults, underperforming modules, hot spots, diode failures, string issues, soiling, vegetation shading and other PV anomalies using drone-based infrared and RGB inspection.</p>
        <div className="thermal-actions"><a className="thermal-primary-button" href="#request">Request an Inspection</a><a className="thermal-secondary-button" href="#anomalies">Explore Detected Anomalies <ArrowDown size={18}/></a></div>
        <div className="thermal-minimum">Minimum thermal inspection site size: <strong>50 kWp</strong></div>
      </div>
    </section>

    <section className="thermal-section thermal-intro"><div className="container thermal-split">
      <div><p className="thermal-kicker">Why it matters</p><h2>See performance losses that remain hidden from the ground.</h2></div>
      <div className="thermal-glass-card"><p>Aerial inspection combines calibrated flight planning, infrared imagery and high-resolution RGB evidence to assess large PV sites quickly and consistently.</p><p>The result is a clearer maintenance priority list, fewer unnecessary truck rolls and stronger evidence for commissioning, warranty and due-diligence decisions.</p></div>
    </div></section>

    <section className="thermal-section" id="anomalies"><div className="container">
      <ThermalHeading kicker="Inspection analytics" title="Anomalies We Detect">Our aerial thermal inspection identifies module, string, electrical, environmental and site-level anomalies that reduce solar plant performance.</ThermalHeading>
      <ThermalAnomalyGrid />
    </div></section>

    <section className="thermal-section thermal-packages"><div className="container">
      <ThermalHeading kicker="Inspection packages" title="Choose the detail level your asset requires">Both inspection levels combine aerial infrared and RGB capture with classified findings and maintenance priorities.</ThermalHeading>
      <div className="thermal-package-grid">
        <Package title="Standard Level Inspection" badge="Standard" points={standardPoints} tags={["O&M inspection", "Commissioning", "EPC handover", "Preventive maintenance", "Portfolio benchmarking"]} />
        <Package title="Comprehensive Level Inspection" badge="Comprehensive" points={comprehensivePoints} tags={["Warranty claim", "Due diligence", "Bank/owner inspection", "Commissioning", "Underperformance diagnosis", "Detailed asset baseline"]} featured />
      </div>
    </div></section>

    <section className="thermal-section"><div className="container">
      <ThermalHeading kicker="Inspection workflow" title="From request to actionable maintenance priorities">A structured process keeps flight capture, analysis and reporting consistent.</ThermalHeading>
      <div className="thermal-workflow">{[
        [ClipboardCheck, "Submit request", "Share site, module and capacity details."],
        [Plane, "Flight planning", "Define safe routes, altitude and data resolution."],
        [Crosshair, "IR + RGB capture", "Collect thermal and color imagery across the asset."],
        [ScanLine, "Anomaly classification", "Review patterns by type, severity and location."],
        [FileSearch, "Report generation", "Issue a clear PDF record with evidence and findings."],
        [Check, "Maintenance support", "Prioritize field checks and corrective work."]
      ].map(([Icon, title, body], index) => { const WorkflowIcon = Icon as typeof Plane; return <div className="workflow-step" key={String(title)}><span>{index + 1}</span><WorkflowIcon size={25}/><h3>{String(title)}</h3><p>{String(body)}</p></div>; })}</div>
    </div></section>

    <section className="thermal-section thermal-request-section" id="request"><div className="container">
      <ThermalHeading kicker="Inspection request" title="Request a Thermal Inspection">Tell us about the plant. PV capacity is calculated automatically from the module rows you provide.</ThermalHeading>
      <ThermalInspectionForm />
    </div></section>

    <section className="thermal-section thermal-faq"><div className="container">
      <ThermalHeading kicker="FAQ" title="Thermal inspection questions">Essential details before requesting an inspection.</ThermalHeading>
      <div className="faq-list">
        <Faq question="What is the minimum site size?">Minimum thermal inspection site size is 50 kWp.</Faq>
        <Faq question="What is the difference between Standard and Comprehensive inspection?">Standard balances speed and useful sub-module detail for routine O&M. Comprehensive flies lower and slower for higher spatial detail, absolute temperature accuracy and warranty-grade investigation.</Faq>
        <Faq question="Do you provide IEC-aligned inspection?">The Comprehensive level is designed for detailed, IEC-aligned aerial infrared inspection requirements.</Faq>
        <Faq question="What information do you need before inspection?">Module model and quantity, DC and AC capacity, site location, access details and the inspection objective.</Faq>
        <Faq question="Do you provide a PDF report?">Yes. Requests receive a PDF confirmation, and completed inspections are documented with classified findings and supporting imagery.</Faq>
        <Faq question="Can you inspect rooftop and ground-mounted PV plants?">Yes. Flight planning is adapted to rooftop, industrial and ground-mounted plant conditions.</Faq>
        <Faq question="Is payment required during request submission?">Not by default. Payment may be requested later if enabled by admin.</Faq>
      </div>
    </div></section>
  </main>;
}

function ThermalHeading({ kicker, title, children }: { kicker: string; title: string; children: React.ReactNode }) {
  return <div className="thermal-heading"><div><p className="thermal-kicker">{kicker}</p><h2>{title}</h2></div><p>{children}</p></div>;
}
function Package({ title, badge, points, tags, featured = false }: { title: string; badge: string; points: readonly string[]; tags: string[]; featured?: boolean }) {
  return <article className={`thermal-package-card ${featured ? "featured" : ""}`}><span className="package-badge">{badge}</span><h3>{title}</h3><ul>{points.map((point) => <li key={point}><Check size={16}/>{point}</li>)}</ul><div className="thermal-tags">{tags.map((tag) => <span key={tag}>{tag}</span>)}</div><a href="#request" className="thermal-primary-button">Request an Inspection</a></article>;
}
function Faq({ question, children }: { question: string; children: React.ReactNode }) { return <details><summary>{question}</summary><p>{children}</p></details>; }
