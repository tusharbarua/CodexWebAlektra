import { deleteSeo, saveSeo } from "@/app/admin/actions";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminSeoPage({ searchParams }: { searchParams: Promise<{ edit?: string }> }) {
  const { edit } = await searchParams;
  const [rows, current] = await Promise.all([prisma.seoMetadata.findMany({ orderBy: { route: "asc" } }), edit ? prisma.seoMetadata.findUnique({ where: { id: edit } }) : null]);
  const keywords = Array.isArray(current?.keywords) ? current.keywords.map(String).join(", ") : "";
  return <div><p className="kicker">SEO</p><h1>Search metadata.</h1>
    <form action={saveSeo} className="panel admin-form"><input type="hidden" name="id" value={current?.id ?? ""} />
      <Input name="route" label="Route" value={current?.route ?? "/"} /><Input name="title" label="Page title" value={current?.title} />
      <label className="field wide"><span>Description</span><textarea name="description" rows={4} defaultValue={current?.description ?? ""} required /></label>
      <Input name="keywords" label="Keywords (comma separated)" value={keywords} /><Input name="ogImage" label="Open Graph image URL" value={current?.ogImage} optional />
      <button className="btn">{current ? "Save changes" : "Add metadata"}</button>
    </form>
    <table className="table"><thead><tr><th>Route</th><th>Title</th><th>Actions</th></tr></thead><tbody>{rows.map((row) => <tr key={row.id}><td>{row.route}</td><td>{row.title}</td><td className="table-actions"><a className="btn secondary compact" href={`/admin/seo?edit=${row.id}`}>Edit</a><form action={deleteSeo}><input type="hidden" name="id" value={row.id} /><button className="btn danger compact">Delete</button></form></td></tr>)}</tbody></table>
  </div>;
}
function Input({ name, label, value, optional = false }: { name: string; label: string; value?: string | null; optional?: boolean }) { return <label className="field"><span>{label}</span><input name={name} defaultValue={value ?? ""} required={!optional} /></label>; }
