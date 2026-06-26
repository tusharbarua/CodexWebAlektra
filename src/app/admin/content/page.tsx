import { saveSiteContent } from "@/app/admin/actions";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
const keys = ["company-introduction", "mission", "vision", "homepage-services", "homepage-contact"];

export default async function AdminContentPage() {
  const rows = await prisma.siteContent.findMany({ where: { key: { in: keys } } });
  const content = new Map(rows.map((row) => [row.key, row]));
  return <div><p className="kicker">Website Content</p><h1>Homepage, mission and vision.</h1><div className="admin-content-grid">
    {keys.map((key) => { const row = content.get(key); return <form action={saveSiteContent} className="panel admin-form" key={key}>
      <input type="hidden" name="key" value={key} /><h2>{key.replaceAll("-", " ")}</h2>
      <label className="field wide"><span>Title</span><input name="title" defaultValue={row?.title ?? ""} required /></label>
      <label className="field wide"><span>Content</span><textarea name="body" rows={6} defaultValue={row?.body ?? ""} required /></label>
      <label className="field"><span>Status</span><select name="status" defaultValue={row?.status ?? "PUBLISHED"}><option>DRAFT</option><option>PUBLISHED</option><option>UNPUBLISHED</option></select></label>
      <button className="btn">Save content</button>
    </form>; })}
  </div></div>;
}
