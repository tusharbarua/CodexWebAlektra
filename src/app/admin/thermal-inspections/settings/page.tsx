import { saveThermalBaseLocation } from "@/app/admin/thermal-actions";
import { DEFAULT_THERMAL_BASE } from "@/lib/thermal-distance";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function ThermalInspectionSettingsPage() {
  const base = await prisma.thermalBaseLocation.findUnique({ where: { singletonKey: "default" } }).catch(() => null);

  return (
    <div>
      <p className="kicker">Alektra Thermal</p>
      <h1>Inspection settings.</h1>
      <section className="panel" style={{ marginTop: 20 }}>
        <h2>Base location for distance calculation</h2>
        <form action={saveThermalBaseLocation} className="admin-form">
          <Field name="name" label="Base location name" value={base?.name ?? DEFAULT_THERMAL_BASE.name} />
          <Field name="address" label="Base address" value={base?.address} optional />
          <Field name="googlePlaceId" label="Optional Google Place ID" value={base?.googlePlaceId} optional />
          <Field name="latitude" label="Base latitude" type="number" step="0.0000001" value={base ? Number(base.latitude) : DEFAULT_THERMAL_BASE.latitude} />
          <Field name="longitude" label="Base longitude" type="number" step="0.0000001" value={base ? Number(base.longitude) : DEFAULT_THERMAL_BASE.longitude} />
          <div className="admin-form-actions"><button className="btn">Save base location</button><a className="btn secondary" href="/admin/thermal-inspections">Back to requests</a></div>
        </form>
      </section>
    </div>
  );
}

function Field({ name, label, value, type = "text", step, optional = false }: { name: string; label: string; value?: string | number | null; type?: string; step?: string; optional?: boolean }) {
  return <label className="field"><span>{label}</span><input name={name} type={type} step={step} defaultValue={value ?? ""} required={!optional} /></label>;
}

