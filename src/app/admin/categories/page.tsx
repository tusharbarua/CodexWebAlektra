import { deleteProductCategory, deleteResourceCategory, saveProductCategory, saveResourceCategory } from "@/app/admin/actions";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  const [productCategories, resourceCategories] = await Promise.all([
    prisma.productCategory.findMany({ include: { _count: { select: { products: true } } }, orderBy: { name: "asc" } }),
    prisma.resourceCategory.findMany({ include: { _count: { select: { articles: true } } }, orderBy: { name: "asc" } })
  ]);
  return <div><p className="kicker">Categories</p><h1>Catalog and resource categories.</h1><div className="admin-two-column">
    <section><h2>Product categories</h2><form action={saveProductCategory} className="panel admin-form"><Input name="name" label="Name" /><Input name="slug" label="Slug" /><Input name="description" label="Description" /><button className="btn">Add category</button></form>
      <CategoryTable rows={productCategories} deleteAction={deleteProductCategory} saveAction={saveProductCategory} /></section>
    <section><h2>Resource categories</h2><form action={saveResourceCategory} className="panel admin-form"><Input name="name" label="Name" /><Input name="slug" label="Slug" /><Input name="description" label="Description" /><button className="btn">Add category</button></form>
      <CategoryTable rows={resourceCategories} deleteAction={deleteResourceCategory} saveAction={saveResourceCategory} /></section>
  </div></div>;
}
function Input({ name, label }: { name: string; label: string }) { return <label className="field"><span>{label}</span><input name={name} required /></label>; }
function CategoryTable({ rows, deleteAction, saveAction }: {
  rows: Array<{ id: string; name: string; slug: string; description?: string | null; _count: { products?: number; articles?: number } }>;
  deleteAction: (data: FormData) => Promise<void>;
  saveAction: (data: FormData) => Promise<void>;
}) {
  return <table className="table"><thead><tr><th>Name</th><th>Slug</th><th>Items</th><th>Actions</th></tr></thead><tbody>{rows.map((row) => {
    const count = row._count.products ?? row._count.articles ?? 0;
    return <tr key={row.id}><td colSpan={2}><form action={saveAction} className="inline-form"><input type="hidden" name="id" value={row.id}/><input name="name" defaultValue={row.name} aria-label="Category name"/><input name="slug" defaultValue={row.slug} aria-label="Category slug"/><input type="hidden" name="description" value={row.description ?? "Category"}/><button className="btn secondary compact">Save</button></form></td><td>{count}</td><td><form action={deleteAction}><input type="hidden" name="id" value={row.id} /><button className="btn danger compact" disabled={count > 0}>Delete</button></form></td></tr>;
  })}</tbody></table>;
}
