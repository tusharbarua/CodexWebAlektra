import { Leaf, Plane, Sprout, Zap } from "lucide-react";
import { impact } from "@/data/site";
import { numberFormat } from "@/lib/format";

const metrics = [
  ["Plants in operation", impact.plantsInOperation, "", Zap],
  ["Installed capacity", impact.totalInstalledCapacityKw, "kW", Zap],
  ["kWh generated", impact.kwhGenerated, "kWh", Zap],
  ["Equivalent trees planted", impact.equivalentTreesPlanted, "", Sprout],
  ["CO2 offset", impact.co2OffsetTons, "tons", Leaf],
  ["Long-haul flights avoided", impact.longHaulFlightsAvoided, "", Plane]
] as const;

export function ImpactDashboard() {
  return (
    <section className="section dark" id="impact">
      <div className="container">
        <div className="section-heading">
          <div>
            <p className="kicker">Live Impact Dashboard</p>
            <h2>Stored baselines, daily updates and future inverter API sync.</h2>
          </div>
          <p>
            Admin-entered launch values stay intact. Future readings from SolisCloud, Sungrow iSolarCloud, SMA Sunny
            Portal or other platforms are appended as ledger rows and added to the stored baseline.
          </p>
        </div>
        <div className="impact-grid">
          {metrics.map(([label, value, suffix, Icon]) => (
            <div className="metric" key={label}>
              <Icon size={22} />
              <strong>
                {numberFormat(value)}
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
