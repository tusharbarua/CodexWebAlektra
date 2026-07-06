import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, isAdminRole, signOut } from "@/lib/auth";

const groups = [
  { label: "Overview", links: [["Dashboard", "/admin"]] },
  { label: "Site Content", links: [["Pages", "/admin/pages"], ["Hero Media", "/admin/hero-media"], ["Footer Settings", "/admin/site-settings/footer"], ["SEO", "/admin/seo"]] },
  { label: "Ecommerce", links: [["Products", "/admin/products"], ["Categories", "/admin/categories"], ["Orders", "/admin/orders"], ["Delivery Settings", "/admin/settings/delivery"], ["Checkout Settings", "/admin/settings/checkout"], ["Payment Instructions", "/admin/settings/payment-instructions"], ["Shop Legal", "/admin/shop/legal"]] },
  { label: "Operations", links: [["Resources", "/admin/resources"], ["Projects", "/admin/projects"], ["Thermal Inspections", "/admin/thermal-inspections"], ["Sparkle Requests", "/admin/sparkle-requests"], ["Mapping Requests", "/admin/mapping-requests"]] },
  { label: "Integrations", links: [["API Integrations", "/admin/integrations"], ["Messaging API", "/admin/integrations/messaging"], ["Location Dataset", "/admin/integrations/location-api"]] },
  { label: "People", links: [["Contact Submissions", "/admin/contacts"], ["Users", "/admin/users"], ["Roles", "/admin/roles"]] },
  { label: "Settings", links: [["Impact Values", "/admin/impact"], ["Homepage Content", "/admin/content"], ["Coupons", "/admin/coupons"], ["Customers", "/admin/customers"]] }
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
          <div><strong>Control Center</strong><span>Manage Alektra website, commerce and operations</span></div>
          <div className="admin-user">
            <span>{user.name || user.email}</span>
            <Link href="/">View Website</Link>
            <form action={async () => {
              "use server";
              await signOut({ redirectTo: "/admin/login" });
            }}>
              <button type="submit">Logout</button>
            </form>
          </div>
        </header>
        <div className="admin-main">{children}</div>
      </section>
    </main>
  );
}
