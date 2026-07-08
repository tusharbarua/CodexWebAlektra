import { deleteResource, saveResource } from "@/app/admin/actions";
import { SingleFilePreview } from "@/components/SingleFilePreview";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminResourcesPage({ searchParams }: { searchParams: Promise<{ edit?: string; error?: string }> }) {
  const { edit, error } = await searchParams;
  const [articles, categories, current] = await Promise.all([
    prisma.resourceArticle.findMany({ include: { category: true }, orderBy: { updatedAt: "desc" } }),
    prisma.resourceCategory.findMany({ orderBy: { name: "asc" } }),
    edit ? prisma.resourceArticle.findUnique({ where: { id: edit } }) : null
  ]);
  return <div><p className="kicker">Resources</p><h1>{current ? "Edit article" : "Learning article management"}</h1>
    {error ? <div className="admin-error">{decodeURIComponent(error)}</div> : null}
    <form action={saveResource} className="panel admin-form">
      <input type="hidden" name="id" value={current?.id ?? ""} />
      <Field name="title" label="Title" value={current?.title} /><Field name="slug" label="Slug" value={current?.slug} />
      <label className="field"><span>Category</span><select name="categoryId" defaultValue={current?.categoryId} required><option value="">Select category</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
      <Field name="coverImage" label="Optional image URL" value={current?.coverImage} />
      <Field name="coverImageAlt" label="Image alt text" value={current?.coverImageAlt} />
      <SingleFilePreview name="coverImageFile" label="Featured image upload" accept="image/jpeg,image/png,image/webp" existingUrl={current?.coverImage} />
      {current?.coverImage ? <label className="check-field"><input type="checkbox" name="deleteCoverImage" /> Delete current featured image</label> : null}
      <Area name="excerpt" label="Short summary" value={current?.excerpt} rows={3} /><Area name="body" label="Main content" value={current?.body} rows={10} />
      <Field name="seoTitle" label="SEO title" value={current?.seoTitle} /><Field name="seoDescription" label="SEO description" value={current?.seoDescription} />
      <Field name="readTimeMinutes" label="Read time minutes (optional)" value={current?.readTimeMinutes ? String(current.readTimeMinutes) : ""} type="number" required={false} />
      <label className="check-field"><input type="checkbox" name="isFeatured" defaultChecked={current?.isFeatured ?? false} /> Featured article</label>
      <label className="field"><span>Status</span><select name="status" defaultValue={current?.status ?? "DRAFT"}><option>DRAFT</option><option>PUBLISHED</option><option>UNPUBLISHED</option></select></label>
      <div className="admin-form-actions"><button className="btn">{current ? "Save changes" : "Add article"}</button>{current ? <a className="btn secondary" href="/admin/resources">Cancel</a> : null}</div>
    </form>
    <table className="table"><thead><tr><th>Title</th><th>Category</th><th>Image</th><th>Featured</th><th>Status</th><th>Updated</th><th>Actions</th></tr></thead><tbody>{articles.map((article) => <tr key={article.id}><td>{article.title}</td><td>{article.category.name}</td><td>{article.coverImage ? "Uploaded" : "None"}</td><td>{article.isFeatured ? "Yes" : "No"}</td><td>{article.status}</td><td>{article.updatedAt.toLocaleDateString()}</td><td className="table-actions"><a className="btn secondary compact" href={`/admin/resources?edit=${article.id}`}>Edit</a><form action={deleteResource}><input type="hidden" name="id" value={article.id} /><button className="btn danger compact">Delete</button></form></td></tr>)}</tbody></table>
  </div>;
}
function Field({ name, label, value, type = "text", required }: { name: string; label: string; value?: string | null; type?: string; required?: boolean }) { return <label className="field"><span>{label}</span><input name={name} type={type} defaultValue={value ?? ""} required={required ?? !["coverImage", "seoTitle", "seoDescription"].includes(name)} /></label>; }
function Area({ name, label, value, rows }: { name: string; label: string; value?: string | null; rows: number }) { return <label className="field wide"><span>{label}</span><textarea name={name} rows={rows} defaultValue={value ?? ""} required /></label>; }
