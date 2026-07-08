import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminEpcProposalsPage() {
  const requests = await prisma.epcProposalRequest.findMany({
    orderBy: { createdAt: "desc" },
    take: 100
  });

  return (
    <div>
      <div className="admin-page-heading">
        <p className="kicker">EPC Requests</p>
        <h1>Solar EPC proposal requests</h1>
        <p>Review facility details, project type, contact information, and proposal notes submitted from the EPC landing page.</p>
      </div>

      <div className="panel table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Request</th>
              <th>Company</th>
              <th>Contact</th>
              <th>Project</th>
              <th>Address</th>
              <th>Status</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {requests.length ? requests.map((request) => (
              <tr key={request.id}>
                <td><strong>{request.requestNumber}</strong></td>
                <td>
                  {request.institutionName}
                  <br />
                  <span className="muted">{request.facilityType}</span>
                </td>
                <td>
                  {request.contactPerson}
                  <br />
                  <a href={`tel:${request.contactNumber}`}>{request.contactNumber}</a>
                  {request.email ? <><br /><a href={`mailto:${request.email}`}>{request.email}</a></> : null}
                </td>
                <td>
                  {request.projectType}
                  <br />
                  <span className="muted">{[request.preferredCapacity, request.roofArea, request.monthlyBill].filter(Boolean).join(" · ") || "Details pending"}</span>
                </td>
                <td>{request.address}</td>
                <td><span className="status-pill">{request.status}</span></td>
                <td>{request.createdAt.toLocaleDateString("en-BD")}</td>
              </tr>
            )) : (
              <tr>
                <td colSpan={7}>No EPC proposal requests have been submitted yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
