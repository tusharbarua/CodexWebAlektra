import { Activity, Factory, Gauge, Leaf, Plane, Sprout } from "lucide-react";
import { Counter } from "@/components/Counter";

export type ImpactValues = {
  plantsInOperation: number;
  totalInstalledCapacityKw: number;
  kwhGenerated: number;
  equivalentTreesPlanted: number;
  co2OffsetTons: number;
  longHaulFlightsAvoided: number;
};

type ImpactContent = {
  kicker?: string | null;
  title?: string | null;
  body?: string | null;
};

function trimNumber(value: number) {
  return Number(value.toFixed(2));
}

export function ImpactDashboard({ impact, content }: { impact: ImpactValues; content?: ImpactContent }) {
  const metrics = [
    ["Plants in operation", impact.plantsInOperation, "", Factory, 0, "plants"],
    ["Installed capacity", trimNumber(impact.totalInstalledCapacityKw / 1000), "MW", Gauge, 2, "capacity"],
    ["Clean energy generated", trimNumber(impact.kwhGenerated / 1000), "MWh", Activity, 2, "energy"],
    ["Equivalent trees planted", impact.equivalentTreesPlanted, "", Sprout, 0, "trees"],
    ["CO2 offset", impact.co2OffsetTons, "tons", Leaf, 1, "co2"],
    ["Long-haul flights avoided", impact.longHaulFlightsAvoided, "", Plane, 0, "flights"]
  ] as const;

  return (
    <section className="section dark" id="impact">
      <div className="container">
        <div className="section-heading">
          <div>
            <p className="kicker">{content?.kicker ?? "Live Impact Dashboard"}</p>
            <h2>{content?.title ?? "Renewable energy creating measurable change."}</h2>
          </div>
          <p>{content?.body ?? "Every operating plant contributes to cleaner air, lower emissions and a more resilient energy future for Bangladesh."}</p>
        </div>
        <div className="impact-grid">
          {metrics.map(([label, value, suffix, Icon, digits, accent]) => (
            <div className={`metric impact-metric-${accent}`} key={label}>
              <Icon size={22} />
              <strong>
                <span className="impact-value-number">
                  <Counter value={value} maximumFractionDigits={digits} />
                </span>
                {suffix ? <small className="impact-value-unit">{suffix}</small> : null}
              </strong>
              <span className="impact-label">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
