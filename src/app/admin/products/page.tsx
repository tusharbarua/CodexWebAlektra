import { prisma } from "@/lib/prisma";
import { money } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const products = await prisma.product.findMany({ include: { category: true }, orderBy: { updatedAt: "desc" } }).catch(() => []);

  return (
    <div>
      <p className="kicker">Products</p>
      <h1>Product management.</h1>
      <div className="panel" style={{ margin: "20px 0" }}>
        <p>Create, edit, publish, unpublish and delete products through the admin API. Product images, galleries, SKU, model, stock, datasheets and manuals are represented in the schema.</p>
      </div>
      <table className="table">
        <thead>
          <tr>
            <th>Name</th>
            <th>SKU</th>
            <th>Category</th>
            <th>Price</th>
            <th>Stock</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <tr key={product.id}>
              <td>{product.name}</td>
              <td>{product.sku}</td>
              <td>{product.category.name}</td>
              <td>{money(Number(product.priceBdt))}</td>
              <td>{product.stockQuantity}</td>
              <td>{product.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
