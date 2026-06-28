import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, isAdminRole } from "@/lib/auth";

const groups = [
  { label: "Overview", links: [["Dashboard", "/admin"]] },
  { label: "Site Content", links: [["Pages", "/admin/pages"], ["Hero Media", "/admin/hero-media"], ["Homepage Content", "/admin/content"], ["Footer Settings", "/admin/site-settings/footer"], ["SEO", "/admin/seo"]] },
  { label: "Ecommerce", links: [["Products", "/admin/products"], ["Categories", "/admin/categories"], ["Orders", "/admin/orders"], ["Coupons", "/admin/coupons"]] },
  { label: "Operations", links: [["Projects", "/admin/projects"], ["Resources", "/admin/resources"], ["Thermal Inspections", "/admin/thermal-inspections"], ["Integrations", "/admin/integrations"], ["Impact", "/admin/impact"]] },
  { label: "People", links: [["Customers", "/admin/customers"], ["Contacts", "/admin/contacts"], ["Users", "/admin/users"], ["Roles", "/admin/roles"]] }
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const user = session?.user;
  if (!user || !isAdminRole(user.role)) redirect("/admin/login");

  return (
    <main className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-brand"><strong>Alektra Admin</strong><span>Control Center</span></div>
        <nav>
          {groups.map((group) => (
            <div className="admin-nav-group" key={group.label}>
              <span>{group.label}</span>
              {group.links.map(([label, href]) => (
                <Link href={href} key={href}>{label}</Link>
              ))}
            </div>
          ))}
        </nav>
      </aside>
      <section className="admin-shell">
        <header className="admin-topbar">
          <div><strong>Dashboard</strong><span>Manage Alektra website operations</span></div>
          <div className="admin-user"><span>{user.email}</span><Link href="/">View site</Link></div>
        </header>
        <div className="admin-main">{children}</div>
      </section>
    </main>
  );
}
