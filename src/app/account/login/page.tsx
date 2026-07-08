import Link from "next/link";
import { redirect } from "next/navigation";
import { CustomerLoginForm } from "@/components/CustomerAccountForms";
import { getCustomerSession } from "@/lib/customer-auth";

export const dynamic = "force-dynamic";

export default async function CustomerLoginPage() {
  const customer = await getCustomerSession();
  if (customer) redirect("/account");
  return (
    <main className="account-auth-page">
      <div className="account-auth-card">
        <p className="kicker">Alektra Shop Account</p>
        <h1>Sign in to your account.</h1>
        <p>Track orders, save delivery addresses, and continue shopping with a smoother checkout.</p>
        <CustomerLoginForm />
        <div className="account-auth-links">
          <Link href="/account/register">Create an account</Link>
          <Link href="/account/forgot-password">Forgot password?</Link>
        </div>
      </div>
    </main>
  );
}
