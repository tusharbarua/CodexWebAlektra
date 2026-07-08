import { CustomerProfileForm } from "@/components/CustomerAccountForms";
import { CustomerAccountShell } from "@/components/CustomerAccountShell";
import { requireCustomer } from "@/lib/customer-auth";

export const dynamic = "force-dynamic";

export default async function AccountProfilePage() {
  const customer = await requireCustomer();
  return (
    <CustomerAccountShell customer={customer} title="Profile." subtitle="Manage your basic account information.">
      <section className="account-panel">
        <CustomerProfileForm fullName={customer.fullName} mobileNumber={customer.mobileNumber} email={customer.email} />
      </section>
    </CustomerAccountShell>
  );
}
