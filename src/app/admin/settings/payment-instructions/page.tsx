import { savePaymentInstructionSettings, testSmtpSettings } from "@/app/admin/actions";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const defaultInstruction = "After completing payment, please reply to this email with your deposit slip/payment receipt, or send it to our WhatsApp. Please write your order number clearly so that we can trace your payment quickly.";

export default async function PaymentInstructionsPage({ searchParams }: { searchParams: Promise<{ saved?: string; test?: string; ok?: string }> }) {
  const params = await searchParams;
  const [settings, site] = await Promise.all([
    prisma.paymentInstructionSetting.findUnique({ where: { singletonKey: "default" } }).catch(() => null),
    prisma.siteSettings.findUnique({ where: { singletonKey: "footer" } }).catch(() => null)
  ]);
  return (
    <div>
      <p className="kicker">Ecommerce</p>
      <h1>Payment instructions.</h1>
      {params.saved ? <div className="admin-success">Payment settings saved.</div> : null}
      {params.test ? <div className={params.ok === "1" ? "admin-success" : "admin-error"}>{params.test}</div> : null}
      <section className="panel">
        <form action={savePaymentInstructionSettings} className="admin-form">
          <label className="check-field"><input type="checkbox" name="manualBankTransferEnabled" defaultChecked={settings?.manualBankTransferEnabled ?? true} /> Enable manual bank transfer instructions</label>
          <label className="check-field"><input type="checkbox" name="showBankInstructionInEmail" defaultChecked={settings?.showBankInstructionInEmail ?? true} /> Show bank instruction in order confirmation email</label>
          <label className="field"><span>Bank account name</span><input name="bankAccountName" defaultValue={settings?.bankAccountName ?? "ALEKTRA RENEWABLE"} required /></label>
          <label className="field"><span>Bank name</span><input name="bankName" defaultValue={settings?.bankName ?? "Dutch Bangla Bank Ltd"} required /></label>
          <label className="field"><span>Branch</span><input name="branchName" defaultValue={settings?.branchName ?? "OR Nizam Road"} required /></label>
          <label className="field"><span>Account number</span><input name="accountNumber" defaultValue={settings?.accountNumber ?? "1291100024117"} required /></label>
          <label className="field"><span>Routing number</span><input name="routingNumber" defaultValue={settings?.routingNumber ?? "090151480"} required /></label>
          <label className="field"><span>Payment email</span><input name="paymentEmail" type="email" defaultValue={settings?.paymentEmail ?? "contact@alektraepc.com"} required /></label>
          <label className="field"><span>WhatsApp number</span><input name="whatsappNumber" defaultValue={settings?.whatsappNumber ?? site?.whatsappNumber ?? ""} /></label>
          <label className="field wide"><span>Payment instruction text</span><textarea name="paymentInstructionText" rows={5} defaultValue={settings?.paymentInstructionText ?? defaultInstruction} required /></label>
          <div className="admin-form-actions"><button className="btn">Save payment settings</button></div>
        </form>
        <form action={testSmtpSettings} className="inline-form">
          <button className="btn secondary compact">Test SMTP connection</button>
          <span>Uses SMTP_HOST, SMTP_PORT, SMTP_USER and SMTP_PASS / SMTP_PASSWORD from environment.</span>
        </form>
      </section>
    </div>
  );
}
