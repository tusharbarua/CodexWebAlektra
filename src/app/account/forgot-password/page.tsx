import Link from "next/link";
import { redirect } from "next/navigation";
import { ForgotPasswordForm } from "@/components/CustomerAccountForms";
import { getCustomerSession } from "@/lib/customer-auth";

export const dynamic = "force-dynamic";

export default async function ForgotPasswordPage() {
  const customer = await getCustomerSession();
  if (customer) redirect("/account");
  return (
    <main className="account-auth-page">
      <div className="account-auth-card">
        <p className="kicker">Password Recovery</p>
        <h1>Reset your password.</h1>
        <p>Enter your account email. If an account exists, we will send a secure password reset link.</p>
        <ForgotPasswordForm />
        <div className="account-auth-links">
          <Link href="/account/login">Back to sign in</Link>
        </div>
      </div>
    </main>
  );
}
