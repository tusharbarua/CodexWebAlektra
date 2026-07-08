import Link from "next/link";
import { CompleteAccountSetupForm } from "@/components/CustomerAccountForms";
import { getValidEmailSetupCustomer } from "@/lib/customer-auth";

export const dynamic = "force-dynamic";

export default async function CompleteSetupPage({
  searchParams
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const params = await searchParams;
  const valid = params.token ? await getValidEmailSetupCustomer(params.token) : null;
  return (
    <main className="account-auth-page">
      <div className="account-auth-card">
        <p className="kicker">Complete Account Setup</p>
        <h1>{valid ? "Set your account password." : "Setup link problem."}</h1>
        {valid ? (
          <>
            <p>Verify your email and create a password to track your Alektra Renewable shop order.</p>
            <CompleteAccountSetupForm token={params.token ?? ""} email={valid.customer.email} />
          </>
        ) : (
          <>
            <p>Account setup link is invalid or expired. Please contact Alektra Renewable if you need help accessing your order.</p>
            <Link className="account-primary-button" href="/account/login">Back to sign in</Link>
          </>
        )}
      </div>
    </main>
  );
}
