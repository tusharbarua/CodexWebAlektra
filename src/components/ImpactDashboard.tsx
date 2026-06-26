import { Leaf, Plane, Sprout, Zap } from "lucide-react";
import { Counter } from "@/components/Counter";

export type ImpactValues = {
  plantsInOperation: number;
  totalInstalledCapacityKw: number;
  kwhGenerated: number;
  equivalentTreesPlanted: number;
  co2OffsetTons: number;
  longHaulFlightsAvoided: number;
};

export function ImpactDashboard({ impact }: { impact: ImpactValues }) {
  const metrics = [
    ["Plants in operation", impact.plantsInOperation, "", Zap, 0],
    ["Installed capacity", impact.totalInstalledCapacityKw, "kW", Zap, 0],
    ["Clean energy generated", impact.kwhGenerated, "kWh", Zap, 0],
    ["Equivalent trees planted", impact.equivalentTreesPlanted, "", Sprout, 0],
    ["CO2 offset", impact.co2OffsetTons, "tons", Leaf, 1],
    ["Long-haul flights avoided", impact.longHaulFlightsAvoided, "", Plane, 0]
  ] as const;

  return (
    <section className="section dark" id="impact">
      <div className="container">
        <div className="section-heading">
          <div>
            <p className="kicker">Live Impact Dashboard</p>
            <h2>Renewable energy creating measurable change.</h2>
          </div>
          <p>
            Every operating plant contributes to cleaner air, lower emissions and a more resilient energy future for
            Bangladesh.
          </p>
        </div>
        <div className="impact-grid">
          {metrics.map(([label, value, suffix, Icon, digits]) => (
            <div className="metric" key={label}>
              <Icon size={22} />
              <strong>
                <Counter value={value} maximumFractionDigits={digits} />
                {suffix ? <small> {suffix}</small> : null}
              </strong>
              <span>{label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
