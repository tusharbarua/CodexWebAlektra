import Link from "next/link";
import { ResetPasswordForm } from "@/components/CustomerAccountForms";
import { getValidPasswordResetCustomer } from "@/lib/customer-auth";

export const dynamic = "force-dynamic";

export default async function ResetPasswordPage({
  searchParams
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const params = await searchParams;
  const valid = params.token ? await getValidPasswordResetCustomer(params.token) : null;
  return (
    <main className="account-auth-page">
      <div className="account-auth-card">
        <p className="kicker">Password Reset</p>
        <h1>{valid ? "Set a new password." : "Reset link problem."}</h1>
        {valid ? (
          <>
            <p>Create a new password for {valid.customer.email}.</p>
            <ResetPasswordForm token={params.token ?? ""} />
          </>
        ) : (
          <>
            <p>Password reset link is invalid or expired.</p>
            <Link className="account-primary-button" href="/account/forgot-password">Request a new reset link</Link>
          </>
        )}
      </div>
    </main>
  );
}
