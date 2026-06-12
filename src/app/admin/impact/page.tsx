import { prisma } from "@/lib/prisma";
import { numberFormat } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminImpactPage() {
  const snapshot = await prisma.impactSnapshot.findFirst({ orderBy: { createdAt: "desc" } }).catch(() => null);
  const ledgerCount = await prisma.impactDailyLedger.count().catch(() => 0);

  return (
    <div>
      <p className="kicker">Impact</p>
      <h1>Impact dashboard values.</h1>
      <div className="panel">
        <p>
          Manual baselines are stored in <code>ImpactSnapshot.manualBaselineJson.baseline</code>. API readings from
          inverter platforms append to <code>ImpactDailyLedger</code> and are added to the baseline during recalculation.
        </p>
      </div>
      {snapshot ? (
        <div className="impact-grid" style={{ marginTop: 24 }}>
          {[
            ["Plants", snapshot.plantsInOperation],
            ["Capacity kW", Number(snapshot.totalInstalledCapacityKw)],
            ["kWh", Number(snapshot.kwhGenerated)],
            ["Trees", Number(snapshot.equivalentTreesPlanted)],
            ["CO2 tons", Number(snapshot.co2OffsetTons)],
            ["Flights", Number(snapshot.longHaulFlightsAvoided)]
          ].map(([label, value]) => (
            <div className="metric" style={{ color: "var(--ink)", background: "#fff", borderColor: "var(--line)" }} key={label}>
              <strong>{numberFormat(Number(value))}</strong>
              <span style={{ color: "var(--muted)" }}>{label}</span>
            </div>
          ))}
        </div>
      ) : null}
      <p style={{ marginTop: 18 }}>Ledger rows: {ledgerCount}</p>
    </div>
  );
}
