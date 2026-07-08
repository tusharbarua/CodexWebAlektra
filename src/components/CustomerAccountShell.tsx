import Link from "next/link";
import { CustomerLogoutForm } from "@/components/CustomerLogoutForm";
import type { CustomerSession } from "@/lib/customer-auth";

export function CustomerAccountShell({
  customer,
  children,
  title,
  subtitle
}: {
  customer: CustomerSession;
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}) {
  const links = [
    ["Overview", "/account"],
    ["Orders", "/account/orders"],
    ["Addresses", "/account/addresses"],
    ["Profile", "/account/profile"]
  ];
  return (
    <main className="account-page">
      <div className="container account-shell">
        <aside className="account-sidebar">
          <div className="account-identity">
            <span>{initials(customer.fullName)}</span>
            <strong>{customer.fullName}</strong>
            <small>{customer.email}</small>
          </div>
          <nav>
            {links.map(([label, href]) => <Link href={href} key={href}>{label}</Link>)}
          </nav>
          <CustomerLogoutForm />
        </aside>
        <section className="account-main">
          <div className="account-heading">
            <p className="kicker">Customer Account</p>
            <h1>{title}</h1>
            {subtitle ? <p>{subtitle}</p> : null}
          </div>
          {children}
        </section>
      </div>
    </main>
  );
}

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "AR";
}
