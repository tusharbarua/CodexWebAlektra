import { prisma } from "@/lib/prisma";
import { deleteProduct, saveProduct } from "@/app/admin/actions";
import { money } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage({ searchParams }: { searchParams: Promise<{ edit?: string }> }) {
  const { edit } = await searchParams;
  const [products, categories, current] = await Promise.all([
    prisma.product.findMany({ include: { category: true, images: { orderBy: { sortOrder: "asc" } } }, orderBy: { updatedAt: "desc" } }),
    prisma.productCategory.findMany({ orderBy: { name: "asc" } }),
    edit ? prisma.product.findUnique({ where: { id: edit }, include: { images: { orderBy: { sortOrder: "asc" } } } }) : null
  ]);
  const specs = current ? Object.entries(current.specifications as Record<string, string>).map(([key, value]) => `${key}: ${value}`).join("\n") : "";
  return <div><p className="kicker">Products</p><h1>{current ? "Edit product" : "Product management"}</h1>
    <form action={saveProduct} className="panel admin-form">
      <input type="hidden" name="id" value={current?.id ?? ""} />
      <Field label="Product name" name="name" value={current?.name} required /><Field label="Slug" name="slug" value={current?.slug} required />
      <Field label="SKU" name="sku" value={current?.sku} required /><Field label="Model" name="model" value={current?.model} required />
      <Field label="Brand" name="brand" value={current?.brand} required />
      <label className="field"><span>Category</span><select name="categoryId" defaultValue={current?.categoryId} required><option value="">Select category</option>{categories.map((category) => <option value={category.id} key={category.id}>{category.name}</option>)}</select></label>
      <Field label="Price (BDT)" name="priceBdt" type="number" value={current ? Number(current.priceBdt) : undefined} required />
      <Field label="Stock quantity" name="stockQuantity" type="number" value={current?.stockQuantity} required />
      <TextArea label="Short description" name="shortDescription" value={current?.shortDescription} required />
      <TextArea label="Full technical description" name="technicalDescription" value={current?.technicalDescription} required />
      <TextArea label="Specifications (one Key: Value per line)" name="specifications" value={specs} required />
      <TextArea label="Image URLs (one per line)" name="imageUrls" value={current?.images.map((image) => image.url).join("\n")} />
      <Field label="Datasheet URL" name="datasheetUrl" value={current?.datasheetUrl} /><Field label="Manual URL" name="manualUrl" value={current?.manualUrl} />
      <label className="field"><span>Status</span><select name="status" defaultValue={current?.status ?? "DRAFT"}><option>DRAFT</option><option>PUBLISHED</option><option>UNPUBLISHED</option></select></label>
      <label className="check-field"><input type="checkbox" name="isFeatured" defaultChecked={current?.isFeatured} /> Featured product</label>
      <div className="admin-form-actions"><button className="btn" type="submit">{current ? "Save changes" : "Add product"}</button>{current ? <a className="btn secondary" href="/admin/products">Cancel</a> : null}</div>
    </form>
    <div className="admin-table-wrap"><table className="table"><thead><tr><th>Name</th><th>SKU</th><th>Category</th><th>Price</th><th>Stock</th><th>Status</th><th>Actions</th></tr></thead><tbody>
      {products.map((product) => <tr key={product.id}><td>{product.name}</td><td>{product.sku}</td><td>{product.category.name}</td><td>{money(Number(product.priceBdt))}</td><td>{product.stockQuantity}</td><td>{product.status}</td><td className="table-actions"><a className="btn secondary compact" href={`/admin/products?edit=${product.id}`}>Edit</a><form action={deleteProduct}><input type="hidden" name="id" value={product.id} /><button className="btn danger compact">Delete</button></form></td></tr>)}
    </tbody></table></div>
  </div>;
}

function Field({ label, name, value, type = "text", required = false }: { label: string; name: string; value?: string | number | null; type?: string; required?: boolean }) {
  return <label className="field"><span>{label}</span><input name={name} type={type} defaultValue={value ?? ""} required={required} /></label>;
}
function TextArea({ label, name, value, required = false }: { label: string; name: string; value?: string | null; required?: boolean }) {
  return <label className="field wide"><span>{label}</span><textarea name={name} rows={4} defaultValue={value ?? ""} required={required} /></label>;
}
