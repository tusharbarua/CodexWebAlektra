import { deleteContact, markContactRead } from "@/app/admin/actions";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminContactsPage() {
  const rows = await prisma.contactSubmission.findMany({ orderBy: { createdAt: "desc" } });
  return <div><p className="kicker">Contacts</p><h1>Contact form submissions.</h1>
    <table className="table"><thead><tr><th>Received</th><th>Contact</th><th>Interest</th><th>Message</th><th>Status</th><th>Actions</th></tr></thead><tbody>{rows.map((row) => <tr key={row.id} className={row.isRead ? "" : "unread-row"}>
      <td>{row.createdAt.toLocaleString()}</td><td><strong>{row.name}</strong><br/><a href={`mailto:${row.email}`}>{row.email}</a><br/>{row.phone}</td><td>{row.interest}<br/><small>{row.company}</small></td><td className="message-cell">{row.message}</td><td>{row.isRead ? "Read" : "New"}</td>
      <td className="table-actions"><form action={markContactRead}><input type="hidden" name="id" value={row.id}/><input type="hidden" name="isRead" value={String(!row.isRead)}/><button className="btn secondary compact">{row.isRead ? "Mark new" : "Mark read"}</button></form><form action={deleteContact}><input type="hidden" name="id" value={row.id}/><button className="btn danger compact">Delete</button></form></td>
    </tr>)}</tbody></table>
    {!rows.length ? <div className="panel"><p>No contact submissions yet.</p></div> : null}
  </div>;
}
