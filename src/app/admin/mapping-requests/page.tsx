import { updateMappingRequest } from "@/app/admin/mapping-actions";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const statuses = ["NEW", "REVIEWED", "QUOTED", "SCHEDULED", "IN_PROGRESS", "COMPLETED", "CANCELLED"] as const;

export default async function MappingRequestsAdmin({ searchParams }: { searchParams: Promise<{ status?: string; view?: string }> }) {
  const params = await searchParams;
  const where = params.status && statuses.includes(params.status as typeof statuses[number]) ? { status: params.status } : undefined;
  const [rows, current] = await Promise.all([
    prisma.mappingServiceRequest.findMany({ where, orderBy: { createdAt: "desc" } }),
    params.view ? prisma.mappingServiceRequest.findUnique({ where: { id: params.view } }) : null
  ]);

  return (
    <div>
      <p className="kicker">Operations</p>
      <h1>Alektra Mapping Requests</h1>
      <p className="admin-muted">Manage drone mapping, photogrammetry, LiDAR, digital twin and geospatial documentation requests.</p>
      <div className="toolbar">
        <form>
          <select name="status" defaultValue={params.status ?? ""} className="toolbar-input">
            <option value="">All statuses</option>
            {statuses.map((status) => <option value={status} key={status}>{status.replaceAll("_", " ")}</option>)}
          </select>
          <button className="btn">Filter</button>
        </form>
      </div>

      {current ? (
        <section className="panel thermal-admin-detail">
          <div className="toolbar">
            <div>
              <h2>{current.requestNumber}</h2>
              <p>{current.institutionName} | {current.serviceType}</p>
            </div>
            <a className="btn secondary" href="/admin/mapping-requests">Close</a>
          </div>
          <div className="admin-detail-grid">
            <p><strong>Contact</strong><br />{current.contactPerson}<br />{current.email || "No email provided"}<br />{current.contactNumber}</p>
            <p><strong>Location</strong><br />{formatAddress(current)}</p>
            <p><strong>Project</strong><br />{current.projectSiteType}<br />{current.projectSize}<br />{current.preferredMethod}</p>
            <p><strong>Submitted</strong><br />{current.createdAt.toLocaleString()}</p>
          </div>
          <div className="panel subtle-panel">
            <h3>Required deliverables</h3>
            <pre className="admin-json-preview">{JSON.stringify(current.requiredDeliverables, null, 2)}</pre>
          </div>
          {current.additionalNotes ? <div className="panel subtle-panel"><h3>Client notes</h3><p>{current.additionalNotes}</p></div> : null}
          <form action={updateMappingRequest} className="admin-form">
            <input type="hidden" name="id" value={current.id} />
            <label className="field"><span>Status</span><select name="status" defaultValue={current.status}>{statuses.map((status) => <option value={status} key={status}>{status.replaceAll("_", " ")}</option>)}</select></label>
            <label className="field wide"><span>Internal notes</span><textarea name="internalNotes" rows={4} defaultValue={current.internalNotes ?? ""} /></label>
            <div className="admin-form-actions"><button className="btn">Save request</button></div>
          </form>
        </section>
      ) : null}

      <table className="table">
        <thead><tr><th>Request</th><th>Institution</th><th>Service</th><th>Method</th><th>Status</th><th></th></tr></thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <td>{row.requestNumber}<br /><small>{row.createdAt.toLocaleDateString()}</small></td>
              <td>{row.institutionName}<br /><small>{row.email || row.contactNumber}</small></td>
              <td>{row.serviceType}</td>
              <td>{row.preferredMethod}</td>
              <td><span className="status-pill">{row.status.replaceAll("_", " ")}</span></td>
              <td><a className="btn secondary compact" href={`/admin/mapping-requests?view=${row.id}${params.status ? `&status=${params.status}` : ""}`}>Open</a></td>
            </tr>
          ))}
        </tbody>
      </table>
      {!rows.length ? <div className="admin-empty-state">No Mapping requests yet.</div> : null}
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
