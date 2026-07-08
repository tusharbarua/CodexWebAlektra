import Link from "next/link";
import { redirect } from "next/navigation";
import { CustomerRegisterForm } from "@/components/CustomerAccountForms";
import { getCustomerSession } from "@/lib/customer-auth";

export const dynamic = "force-dynamic";

export default async function CustomerRegisterPage() {
  const customer = await getCustomerSession();
  if (customer) redirect("/account");
  return (
    <main className="account-auth-page">
      <div className="account-auth-card">
        <p className="kicker">Create Account</p>
        <h1>Join Alektra Renewable Shop.</h1>
        <p>Create an account to track orders and save delivery addresses. Guest checkout remains available.</p>
        <CustomerRegisterForm />
        <div className="account-auth-links">
          <Link href="/account/login">Already have an account? Sign in</Link>
        </div>
      </div>
    </main>
  );
}
