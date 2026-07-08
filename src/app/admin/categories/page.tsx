import { deleteProductCategory, deleteResourceCategory, saveProductCategory, saveResourceCategory } from "@/app/admin/actions";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  const [productCategories, resourceCategories] = await Promise.all([
    prisma.productCategory.findMany({ include: { _count: { select: { products: true } } }, orderBy: [{ sortOrder: "asc" }, { name: "asc" }] }),
    prisma.resourceCategory.findMany({ include: { _count: { select: { articles: true } } }, orderBy: [{ sortOrder: "asc" }, { name: "asc" }] })
  ]);
  return <div><p className="kicker">Categories</p><h1>Catalog and resource categories.</h1><div className="admin-two-column">
    <section><h2>Product categories</h2><form action={saveProductCategory} className="panel admin-form"><ProductCategoryFields categories={productCategories} /><button className="btn">Add category</button></form>
      <ProductCategoryTable rows={productCategories} /></section>
    <section><h2>Resource categories</h2><form action={saveResourceCategory} className="panel admin-form"><Input name="name" label="Name" /><Input name="slug" label="Slug" /><Input name="description" label="Description" /><Input name="icon" label="Icon key" /><Input name="sortOrder" label="Sort order" type="number" value={0} /><label className="field"><span>Status</span><select name="status" defaultValue="PUBLISHED"><option>PUBLISHED</option><option>DRAFT</option><option>UNPUBLISHED</option></select></label><button className="btn">Add category</button></form>
      <ResourceCategoryTable rows={resourceCategories} /></section>
  </div></div>;
}

function ProductCategoryFields({ categories, current }: {
  categories: Array<{ id: string; name: string; parentId?: string | null }>;
  current?: { name: string; slug: string; description?: string | null; parentId?: string | null; icon?: string | null; sortOrder?: number; status?: string };
}) {
  return <>
    <Input name="name" label="Name" value={current?.name} />
    <Input name="slug" label="Slug" value={current?.slug} />
    <Input name="description" label="Description" value={current?.description ?? ""} />
    <label className="field"><span>Parent category</span><select name="parentId" defaultValue={current?.parentId ?? ""}><option value="">No parent</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
    <Input name="icon" label="Icon key" value={current?.icon ?? ""} />
    <Input name="sortOrder" label="Sort order" type="number" value={current?.sortOrder ?? 0} />
    <label className="field"><span>Status</span><select name="status" defaultValue={current?.status ?? "PUBLISHED"}><option>PUBLISHED</option><option>DRAFT</option><option>UNPUBLISHED</option></select></label>
  </>;
}

function ProductCategoryTable({ rows }: {
  rows: Array<{ id: string; name: string; slug: string; description?: string | null; parentId?: string | null; icon?: string | null; sortOrder: number; status: string; _count: { products: number } }>;
}) {
  return <table className="table"><thead><tr><th>Name</th><th>Parent</th><th>Icon</th><th>Sort</th><th>Status</th><th>Products</th><th>Actions</th></tr></thead><tbody>{rows.map((row) => {
    const parent = rows.find((candidate) => candidate.id === row.parentId);
    return <tr key={row.id}><td colSpan={5}><form action={saveProductCategory} className="inline-form category-inline-form"><input type="hidden" name="id" value={row.id}/><input name="name" defaultValue={row.name} aria-label="Category name"/><input name="slug" defaultValue={row.slug} aria-label="Category slug"/><input name="description" defaultValue={row.description ?? ""} aria-label="Description"/><select name="parentId" defaultValue={row.parentId ?? ""} aria-label="Parent category"><option value="">No parent</option>{rows.filter((candidate) => candidate.id !== row.id).map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select><input name="icon" defaultValue={row.icon ?? ""} aria-label="Icon key"/><input name="sortOrder" type="number" defaultValue={row.sortOrder} aria-label="Sort order"/><select name="status" defaultValue={row.status} aria-label="Status"><option>PUBLISHED</option><option>DRAFT</option><option>UNPUBLISHED</option></select><button className="btn secondary compact">Save</button></form><small>Parent: {parent?.name ?? "None"}</small></td><td>{row._count.products}</td><td><form action={deleteProductCategory}><input type="hidden" name="id" value={row.id} /><button className="btn danger compact" disabled={row._count.products > 0}>Delete</button></form></td></tr>;
  })}</tbody></table>;
}

function ResourceCategoryTable({ rows }: {
  rows: Array<{ id: string; name: string; slug: string; description?: string | null; icon?: string | null; sortOrder: number; status: string; _count: { articles?: number } }>;
}) {
  return <table className="table"><thead><tr><th>Name</th><th>Slug</th><th>Items</th><th>Actions</th></tr></thead><tbody>{rows.map((row) => {
    const count = row._count.articles ?? 0;
    return <tr key={row.id}><td colSpan={2}><form action={saveResourceCategory} className="inline-form"><input type="hidden" name="id" value={row.id}/><input name="name" defaultValue={row.name} aria-label="Category name"/><input name="slug" defaultValue={row.slug} aria-label="Category slug"/><input name="description" defaultValue={row.description ?? "Category"} aria-label="Description"/><input name="icon" defaultValue={row.icon ?? ""} aria-label="Icon key"/><input name="sortOrder" type="number" defaultValue={row.sortOrder} aria-label="Sort order"/><select name="status" defaultValue={row.status} aria-label="Status"><option>PUBLISHED</option><option>DRAFT</option><option>UNPUBLISHED</option></select><button className="btn secondary compact">Save</button></form></td><td>{count}</td><td><form action={deleteResourceCategory}><input type="hidden" name="id" value={row.id} /><button className="btn danger compact" disabled={count > 0}>Delete</button></form></td></tr>;
  })}</tbody></table>;
}

function Input({ name, label, value, type = "text" }: { name: string; label: string; value?: string | number | null; type?: string }) {
  return <label className="field"><span>{label}</span><input name={name} type={type} defaultValue={value ?? ""} required={name !== "description" && name !== "icon"} /></label>;
}
