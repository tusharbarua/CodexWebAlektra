import { resendThermalRequest, saveThermalPricing, updateThermalRequest } from "@/app/admin/thermal-actions";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function ThermalInspectionAdmin({ searchParams }: { searchParams: Promise<{ status?: string; view?: string }> }) {
  const params = await searchParams;
  const [rows, current, pricing] = await Promise.all([
    prisma.thermalInspectionRequest.findMany({ where: params.status ? { status: params.status as never } : undefined, orderBy: { createdAt: "desc" } }),
    params.view ? prisma.thermalInspectionRequest.findUnique({ where: { id: params.view } }) : null,
    prisma.thermalPricingRule.findFirst({ where: { isActive: true } })
  ]);
  const modules = current?.moduleDetails as Array<{ model: string; capacityWp: number; quantity: number }> | undefined;
  return <div><p className="kicker">Alektra Thermal</p><h1>Thermal inspection requests.</h1>
    <div className="toolbar"><form><select name="status" defaultValue={params.status ?? ""} className="toolbar-input"><option value="">All statuses</option>{statuses.map((status) => <option key={status}>{status}</option>)}</select><button className="btn">Filter</button></form><a className="btn secondary" href="/api/admin/thermal-inspections/export">Export CSV</a></div>
    {current ? <section className="panel thermal-admin-detail"><div className="toolbar"><div><h2>{current.requestNumber}</h2><p>{current.institutionName} | {String(current.pvCapacityKwp)} kWp</p></div><a className="btn secondary" href="/admin/thermal-inspections">Close</a></div>
      <div className="admin-two-column"><div><h3>Request</h3><p>{current.inspectionType} inspection<br/>{current.projectLocation}<br/>{current.address}<br/>{current.email}<br/>{current.contactNumber}</p><h3>Modules</h3>{modules?.map((module, index) => <p key={index}>{module.model}: {module.capacityWp} Wp x {module.quantity}</p>)}<p><strong>AC capacity:</strong> {String(current.acCapacityKw)} kW</p><p>{current.additionalNotes}</p></div>
      <form action={updateThermalRequest} className="admin-form"><input type="hidden" name="id" value={current.id}/><label className="field"><span>Status</span><select name="status" defaultValue={current.status}>{statuses.map((status) => <option key={status}>{status}</option>)}</select></label><label className="field"><span>Inspection fee (BDT)</span><input name="calculatedFeeBdt" type="number" min="0" defaultValue={current.calculatedFeeBdt ? Number(current.calculatedFeeBdt) : ""}/></label><label className="check-field"><input type="checkbox" name="askForPayment" defaultChecked={current.askForPayment}/> Ask for payment</label><label className="field wide"><span>Internal notes</span><textarea name="internalNotes" rows={6} defaultValue={current.internalNotes ?? ""}/></label><button className="btn">Save request</button></form></div>
      <div className="table-actions"><a className="btn secondary" href={`/api/thermal-inspections/${current.requestNumber}/pdf`}>Download PDF</a><form action={resendThermalRequest}><input type="hidden" name="id" value={current.id}/><button className="btn secondary">Resend email/PDF</button></form><span>Payment: {current.paymentStatus}</span></div>
    </section> : null}
    <table className="table"><thead><tr><th>Request</th><th>Institution</th><th>Inspection</th><th>Capacity</th><th>Status</th><th>Payment</th><th></th></tr></thead><tbody>{rows.map((row) => <tr key={row.id}><td>{row.requestNumber}<br/><small>{row.createdAt.toLocaleDateString()}</small></td><td>{row.institutionName}<br/><small>{row.email}</small></td><td>{row.inspectionType}</td><td>{String(row.pvCapacityKwp)} kWp</td><td>{row.status}</td><td>{row.paymentStatus}</td><td><a className="btn secondary compact" href={`/admin/thermal-inspections?view=${row.id}${params.status ? `&status=${params.status}` : ""}`}>Open</a></td></tr>)}</tbody></table>
    <section className="panel" style={{ marginTop: 28 }}><h2>Pricing rules</h2><form action={saveThermalPricing} className="admin-form">
      <Pricing name="baseInspectionFeeBdt" label="Base fee" value={pricing?.baseInspectionFeeBdt}/><Pricing name="ratePerKwpBdt" label="Rate per kWp" value={pricing?.ratePerKwpBdt}/><Pricing name="distanceChargePerKmBdt" label="Distance charge per km" value={pricing?.distanceChargePerKmBdt}/><Pricing name="minimumInspectionFeeBdt" label="Minimum fee" value={pricing?.minimumInspectionFeeBdt}/><Pricing name="standardMultiplier" label="Standard multiplier" value={pricing?.standardMultiplier ?? 1}/><Pricing name="comprehensiveMultiplier" label="Comprehensive multiplier" value={pricing?.comprehensiveMultiplier ?? 1.5}/><button className="btn">Save pricing rules</button>
    </form></section>
  </div>;
}
const statuses = ["NEW", "REVIEWED", "QUOTED", "AWAITING_PAYMENT", "PAID", "SCHEDULED", "COMPLETED", "CANCELLED"];
function Pricing({ name, label, value }: { name: string; label: string; value?: { toString(): string } | number | null }) { return <label className="field"><span>{label} (BDT)</span><input name={name} type="number" min="0" step="0.01" defaultValue={value?.toString() ?? 0} required/></label>; }
