import Link from "next/link";
import { verifyCustomerEmailToken } from "@/lib/customer-auth";

export const dynamic = "force-dynamic";

export default async function VerifyEmailPage({
  searchParams
}: {
  searchParams: Promise<{ token?: string; email?: string }>;
}) {
  const params = await searchParams;
  const result = params.token ? await verifyCustomerEmailToken(params.token) : { ok: false, message: "Verification token is missing." };
  return (
    <main className="account-auth-page">
      <div className="account-auth-card">
        <p className="kicker">Email Verification</p>
        <h1>{result.ok ? "Email verified." : "Verification problem."}</h1>
        <p>{result.message}</p>
        {result.ok ? (
          <Link className="account-primary-button" href="/account/login">Sign in now</Link>
        ) : (
          <p className="account-support-note">Please contact Alektra Renewable if you did not receive the verification email.</p>
        )}
      </div>
    </main>
  );
}
