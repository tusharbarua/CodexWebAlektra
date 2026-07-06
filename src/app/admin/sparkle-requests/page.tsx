import { SparkleRequestStatus, SparkleServiceType } from "@prisma/client";
import { updateSparkleRequest } from "@/app/admin/sparkle-actions";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const serviceLabels: Record<SparkleServiceType, string> = {
  ROUTINE_CLEANING: "Routine Cleaning",
  ONE_TIME_DEEP_CLEANING: "One-Time Deep Cleaning",
  SCHEDULED_MAINTENANCE_CLEANING: "Scheduled Maintenance Cleaning",
  INSPECTION_CLEANING_COORDINATION: "Inspection + Cleaning Coordination"
};

export default async function SparkleRequestsAdmin({ searchParams }: { searchParams: Promise<{ status?: string; view?: string }> }) {
  const params = await searchParams;
  const where = params.status && Object.values(SparkleRequestStatus).includes(params.status as SparkleRequestStatus)
    ? { status: params.status as SparkleRequestStatus }
    : undefined;
  const [rows, current] = await Promise.all([
    prisma.sparkleServiceRequest.findMany({ where, orderBy: { createdAt: "desc" } }),
    params.view ? prisma.sparkleServiceRequest.findUnique({ where: { id: params.view } }) : null
  ]);

  return (
    <div>
      <p className="kicker">Operations</p>
      <h1>Alektra Sparkle Requests</h1>
      <p className="admin-muted">Manage solar panel cleaning service requests for industrial and commercial rooftop systems.</p>
      <div className="toolbar">
        <form>
          <select name="status" defaultValue={params.status ?? ""} className="toolbar-input">
            <option value="">All statuses</option>
            {Object.values(SparkleRequestStatus).map((status) => <option value={status} key={status}>{status.replaceAll("_", " ")}</option>)}
          </select>
          <button className="btn">Filter</button>
        </form>
      </div>

      {current ? (
        <section className="panel thermal-admin-detail">
          <div className="toolbar">
            <div>
              <h2>{current.requestNumber}</h2>
              <p>{current.institutionName} | {String(current.pvCapacityKwp)} kWp | {serviceLabels[current.serviceType]}</p>
            </div>
            <a className="btn secondary" href="/admin/sparkle-requests">Close</a>
          </div>
          <div className="admin-detail-grid">
            <p><strong>Contact</strong><br />{current.email}<br />{current.contactNumber}</p>
            <p><strong>Location</strong><br />{formatAddress(current)}</p>
            <p><strong>Capacity</strong><br />PV: {String(current.pvCapacityKwp)} kWp<br />AC: {String(current.acCapacityKw)} kW</p>
            <p><strong>Submitted</strong><br />{current.createdAt.toLocaleString()}</p>
          </div>
          <div className="panel subtle-panel">
            <h3>Module details</h3>
            <pre className="admin-json-preview">{JSON.stringify(current.moduleDetails, null, 2)}</pre>
          </div>
          {current.additionalNotes ? <div className="panel subtle-panel"><h3>Client notes</h3><p>{current.additionalNotes}</p></div> : null}
          <form action={updateSparkleRequest} className="admin-form">
            <input type="hidden" name="id" value={current.id} />
            <label className="field"><span>Status</span><select name="status" defaultValue={current.status}>{Object.values(SparkleRequestStatus).map((status) => <option value={status} key={status}>{status.replaceAll("_", " ")}</option>)}</select></label>
            <label className="field wide"><span>Internal notes</span><textarea name="internalNotes" rows={4} defaultValue={current.internalNotes ?? ""} /></label>
            <div className="admin-form-actions"><button className="btn">Save request</button></div>
          </form>
        </section>
      ) : null}

      <table className="table">
        <thead><tr><th>Request</th><th>Institution</th><th>Service</th><th>Capacity</th><th>Status</th><th></th></tr></thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <td>{row.requestNumber}<br /><small>{row.createdAt.toLocaleDateString()}</small></td>
              <td>{row.institutionName}<br /><small>{row.email}</small></td>
              <td>{serviceLabels[row.serviceType]}</td>
              <td>{String(row.pvCapacityKwp)} kWp</td>
              <td><span className="status-pill">{row.status.replaceAll("_", " ")}</span></td>
              <td><a className="btn secondary compact" href={`/admin/sparkle-requests?view=${row.id}${params.status ? `&status=${params.status}` : ""}`}>Open</a></td>
            </tr>
          ))}
        </tbody>
      </table>
      {!rows.length ? <div className="admin-empty-state">No Sparkle requests yet.</div> : null}
    </div>
  );
}

function formatAddress(row: {
  addressLine: string;
  manualAddressFallback: boolean;
  districtName: string | null;
  divisionName: string | null;
  upazilaName: string | null;
  postOffice: string | null;
  postalCode: string | null;
}) {
  return [
    row.addressLine,
    row.manualAddressFallback ? row.districtName : [row.upazilaName, row.districtName, row.divisionName].filter(Boolean).join(", "),
    row.postOffice || row.postalCode ? [row.postOffice, row.postalCode].filter(Boolean).join(" - ") : null
  ].filter(Boolean).join("\n");
}
