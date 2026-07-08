import { saveImpact } from "@/app/admin/actions";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminImpactPage() {
  const row = await prisma.impactSnapshot.findFirst({ orderBy: { createdAt: "desc" } });
  return <div><p className="kicker">Impact</p><h1>Impact dashboard values.</h1>
    <form action={saveImpact} className="panel admin-form">
      <Field name="plantsInOperation" label="Plants in operation" value={row?.plantsInOperation} />
      <Field name="totalInstalledCapacityKw" label="Installed capacity baseline, kW" value={Number(row?.totalInstalledCapacityKw ?? 0)} help="Displayed as MW on the public website." />
      <Field name="kwhGenerated" label="Clean energy generation baseline, kWh" value={Number(row?.kwhGenerated ?? 0)} help="Displayed as MWh on the public website." />
      <Field name="equivalentTreesPlanted" label="Equivalent trees planted" value={Number(row?.equivalentTreesPlanted ?? 0)} />
      <Field name="co2OffsetTons" label="CO2 offset (tons)" value={Number(row?.co2OffsetTons ?? 0)} step="0.01" />
      <Field name="longHaulFlightsAvoided" label="Long-haul flights avoided" value={Number(row?.longHaulFlightsAvoided ?? 0)} />
      <button className="btn">Update impact values</button>
    </form>
  </div>;
}
function Field({ name, label, value, step = "1", help }: { name: string; label: string; value?: number; step?: string; help?: string }) {
  return <label className="field"><span>{label}</span><input name={name} type="number" min="0" step={step} defaultValue={value ?? 0} required />{help ? <small>{help}</small> : null}</label>;
}
