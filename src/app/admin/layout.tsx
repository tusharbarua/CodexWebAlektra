import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, isAdminRole } from "@/lib/auth";

const links = [
  ["Overview", "/admin"],
  ["Content", "/admin/content"],
  ["Hero media", "/admin/media"],
  ["Projects", "/admin/projects"],
  ["Impact", "/admin/impact"],
  ["Integrations", "/admin/integrations"],
  ["Thermal inspections", "/admin/thermal-inspections"],
  ["Resources", "/admin/resources"],
  ["Products", "/admin/products"],
  ["Categories", "/admin/categories"],
  ["Orders", "/admin/orders"],
  ["Customers", "/admin/customers"],
  ["Coupons", "/admin/coupons"],
  ["Contacts", "/admin/contacts"],
  ["SEO", "/admin/seo"],
  ["Users & roles", "/admin/users"]
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const user = session?.user;
  if (!user || !isAdminRole(user.role)) redirect("/admin/login");

  return (
    <main className="admin-layout">
      <aside className="admin-sidebar">
        <strong>Alektra Admin</strong>
        <p>{user.email}</p>
        <nav>
          {links.map(([label, href]) => (
            <Link href={href} key={href}>{label}</Link>
          ))}
        </nav>
      </aside>
      <section className="admin-main">{children}</section>
    </main>
  );
}
