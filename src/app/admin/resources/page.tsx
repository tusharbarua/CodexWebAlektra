import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminResourcesPage() {
  const articles = await prisma.resourceArticle.findMany({ include: { category: true }, orderBy: { updatedAt: "desc" } }).catch(() => []);

  return (
    <div>
      <p className="kicker">Resources</p>
      <h1>Learning article management.</h1>
      <div className="panel" style={{ margin: "20px 0" }}>
        <p>Articles support create, edit, publish, unpublish and delete workflows through the protected resource API.</p>
      </div>
      <table className="table">
        <thead>
          <tr>
            <th>Title</th>
            <th>Category</th>
            <th>Status</th>
            <th>Published</th>
          </tr>
        </thead>
        <tbody>
          {articles.map((article) => (
            <tr key={article.id}>
              <td>{article.title}</td>
              <td>{article.category.name}</td>
              <td>{article.status}</td>
              <td>{article.publishedAt?.toLocaleDateString() ?? "Not published"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
