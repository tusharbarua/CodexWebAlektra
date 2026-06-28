import { saveMessagingIntegration, testMessagingIntegration } from "@/app/admin/actions";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function MessagingIntegrationPage({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  const params = await searchParams;
  const settings = await prisma.messagingIntegration.findUnique({ where: { singletonKey: "default" } }).catch(() => null);
  return (
    <div>
      <p className="kicker">Integrations</p>
      <h1>Messaging API.</h1>
      {params.saved ? <div className="admin-success">Messaging settings saved.</div> : null}
      <section className="panel">
        <form action={saveMessagingIntegration} className="admin-form">
          <label className="field"><span>Provider name</span><input name="providerName" defaultValue={settings?.providerName ?? "Not configured"} required /></label>
          <label className="field"><span>API base URL</span><input name="baseUrl" defaultValue={settings?.baseUrl ?? ""} /></label>
          <label className="field"><span>API key / token</span><input name="apiKey" placeholder={settings?.apiKey ? "Stored key is masked. Enter a new key to replace." : ""} /></label>
          <label className="field"><span>Sender ID</span><input name="senderId" defaultValue={settings?.senderId ?? ""} /></label>
          <label className="field wide"><span>OTP SMS template</span><textarea name="otpTemplate" rows={3} defaultValue={settings?.otpTemplate ?? "Your Alektra Renewable OTP is [OTP]. It expires in 5 minutes."} required /></label>
          <label className="field wide"><span>Order confirmation template</span><textarea name="orderConfirmationTemplate" rows={3} defaultValue={settings?.orderConfirmationTemplate ?? "Your Alektra Renewable order #[ORDER_NUMBER] has been received. Total: BDT [TOTAL]. We will contact you shortly."} required /></label>
          <label className="check-field"><input type="checkbox" name="isEnabled" defaultChecked={settings?.isEnabled ?? false} /> Enabled</label>
          <div className="admin-form-actions"><button className="btn">Save messaging settings</button></div>
        </form>
        <form action={testMessagingIntegration} className="inline-form">
          <input name="testMobile" placeholder="+880..." />
          <button className="btn secondary compact">Test SMS</button>
          <span>{settings?.lastTestStatus ?? "No test sent yet."}</span>
        </form>
      </section>
    </div>
  );
}
