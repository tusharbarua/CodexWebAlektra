import { notFound } from "next/navigation";
import { learningArticles } from "@/data/site";

const articleBodies: Record<string, string[]> = {
  "choosing-solar-modules-industrial-roofs": [
    "A well-designed rooftop solar plant starts with module selection. Alektra evaluates module efficiency, temperature coefficient, product warranty, linear performance warranty, mechanical load rating and bankability.",
    "For industrial roofs, module choice must fit available roof area, shading profile, maintenance access and mounting layout. High-efficiency mono PERC, TOPCon and bifacial modules can improve output where roof area is constrained, but lifecycle performance matters more than nameplate wattage alone."
  ],
  "inverter-selection-monitoring-basics": [
    "Inverters convert DC power from modules into usable AC power and provide the operating data needed for reliable solar asset management.",
    "Alektra reviews DC/AC ratio, MPPT count, voltage windows, protection class, grid-code compliance, warranty and local service support. Monitoring portals such as SolisCloud, Sungrow iSolarCloud and SMA Sunny Portal can later feed production data into the Alektra impact ledger without overwriting manual baselines."
  ],
  "net-metering-economics": [
    "Alektra models solar savings against utility consumption, tariff assumptions and projected energy-cost escalation.",
    "The brochure energy page estimates annual usage of 466,533 kWh and applies a 3.0% yearly increase in energy cost. Monthly generation and bill reduction help clients understand payback, while net metering can improve economics by crediting eligible exported energy."
  ]
};

export function generateStaticParams() {
  return learningArticles.map((article) => ({ slug: article.slug }));
}

export default async function ResourceArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = learningArticles.find((item) => item.slug === slug);
  if (!article) notFound();

  return (
    <main className="page-shell">
      <article className="container panel" style={{ maxWidth: 860 }}>
        <p className="kicker">{article.category}</p>
        <h1>{article.title}</h1>
        <p>{article.excerpt}</p>
        {(articleBodies[article.slug] ?? []).map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </article>
    </main>
  );
}
