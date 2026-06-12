import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const [products, orders, resources, contacts] = await Promise.all([
    prisma.product.count().catch(() => 0),
    prisma.order.count().catch(() => 0),
    prisma.resourceArticle.count().catch(() => 0),
    prisma.contactSubmission.count().catch(() => 0)
  ]);

  const cards = [
    ["Products", products],
    ["Orders", orders],
    ["Resource articles", resources],
    ["Contact submissions", contacts]
  ];

  return (
    <div>
      <p className="kicker">Dashboard</p>
      <h1>Control center.</h1>
      <div className="impact-grid" style={{ marginTop: 24 }}>
        {cards.map(([label, value]) => (
          <div className="metric" style={{ color: "var(--ink)", background: "#fff", borderColor: "var(--line)" }} key={label}>
            <strong>{value}</strong>
            <span style={{ color: "var(--muted)" }}>{label}</span>
          </div>
        ))}
      </div>
      <div className="panel" style={{ marginTop: 24 }}>
        <h2>Operational coverage</h2>
        <p>
          Manage website content, hero images/videos, projects, impact values, monitoring API settings, resources,
          products, categories, orders, customers, coupons, contact submissions, SEO metadata and users/roles from this
          protected dashboard.
        </p>
      </div>
    </div>
  );
}
