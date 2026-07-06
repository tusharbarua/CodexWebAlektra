import { saveCheckoutSettings } from "@/app/admin/actions";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function CheckoutSettingsPage({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  const params = await searchParams;
  const settings = await prisma.ecommerceCheckoutSetting.findUnique({ where: { singletonKey: "default" } }).catch(() => null);
  return (
    <div>
      <p className="kicker">Ecommerce</p>
      <h1>Checkout settings.</h1>
      {params.saved ? <div className="admin-success">Checkout settings saved.</div> : null}
      <form action={saveCheckoutSettings} className="panel admin-form">
        <label className="check-field">
          <input type="checkbox" name="requireOtpVerification" defaultChecked={settings?.requireOtpVerification ?? false} />
          Require OTP verification before order confirmation
        </label>
        <p className="admin-muted">When enabled, customers must verify their Bangladeshi mobile number by OTP before placing an order. When disabled, a valid mobile number is still required but OTP is hidden.</p>
        <div className="admin-form-actions"><button className="btn">Save checkout settings</button></div>
      </form>
    </div>
  );
}
