import { deleteIntegration, manualSyncIntegration, saveIntegration, testIntegration } from "@/app/admin/actions";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminIntegrationsPage({ searchParams }: { searchParams: Promise<{ edit?: string }> }) {
  const { edit } = await searchParams;
  const integrations = await prisma.monitoringIntegration.findMany({ orderBy: { updatedAt: "desc" } }).catch(() => []);
  const current = edit ? await prisma.monitoringIntegration.findUnique({ where: { id: edit } }) : null;

  return (
    <div>
      <p className="kicker">API Integrations</p>
      <h1>{current ? "Edit monitoring integration" : "Inverter monitoring integrations"}</h1>
      <form action={saveIntegration} className="panel admin-form">
        <input type="hidden" name="id" value={current?.id ?? ""} />
        <Field name="label" label="Integration name" value={current?.label} />
        <label className="field"><span>Provider</span><select name="provider" defaultValue={current?.provider ?? "SOLISCLOUD"}><option value="SOLISCLOUD">SolisCloud</option><option value="SUNGROW_ISOLARCLOUD">Sungrow iSolarCloud</option><option value="SMA_SUNNY_PORTAL">SMA Sunny Portal</option><option value="GENERIC">Generic REST API / Other</option></select></label>
        <Field name="baseUrl" label="Base API URL" value={current?.baseUrl} optional />
        <Field name="apiKey" label="API key / token" placeholder={current?.apiKey ? "Stored securely - enter a new value to replace" : ""} optional />
        <Field name="apiSecret" label="API secret" placeholder={current?.apiSecret ? "Stored securely - enter a new value to replace" : ""} optional />
        <Field name="username" label="Username" placeholder={current?.username ? "Stored - enter a new value to replace" : ""} optional />
        <Field name="password" label="Password" type="password" placeholder={current?.password ? "Stored - enter a new value to replace" : ""} optional />
        <Field name="plantMapping" label="Plant ID / site ID / inverter serial mapping" value={current?.plantMapping} optional />
        <Field name="syncFrequencyMinutes" label="Sync frequency (minutes)" type="number" value={current?.syncFrequencyMinutes ?? 1440} />
        <label className="check-field"><input type="checkbox" name="isEnabled" defaultChecked={current?.isEnabled} /> Enabled</label>
        <div className="admin-form-actions"><button className="btn">{current ? "Save integration" : "Add integration"}</button>{current ? <a className="btn secondary" href="/admin/integrations">Cancel</a> : null}</div>
      </form>
      <table className="table">
        <thead>
          <tr>
            <th>Label</th>
            <th>Provider</th>
            <th>Enabled</th>
            <th>Last sync</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {integrations.map((integration) => (
            <tr key={integration.id}>
              <td>{integration.label}</td>
              <td>{integration.provider}</td>
              <td>{integration.isEnabled ? "Yes" : "No"}</td>
              <td>{integration.lastSyncAt?.toLocaleString() ?? "Never"}</td>
              <td><strong>{integration.lastSyncStatus ?? "Not tested"}</strong><br /><small>{integration.lastSyncMessage ?? "Credentials are masked in the admin UI."}</small></td>
              <td className="table-actions">
                <a className="btn secondary compact" href={`/admin/integrations?edit=${integration.id}`}>Edit</a>
                <form action={testIntegration}><input type="hidden" name="id" value={integration.id} /><button className="btn secondary compact">Test</button></form>
                <form action={manualSyncIntegration}><input type="hidden" name="id" value={integration.id} /><button className="btn secondary compact">Manual sync</button></form>
                <form action={deleteIntegration}><input type="hidden" name="id" value={integration.id} /><button className="btn danger compact">Delete</button></form>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Field({ name, label, value, type = "text", optional = false, placeholder = "" }: { name: string; label: string; value?: string | number | null; type?: string; optional?: boolean; placeholder?: string }) {
  return <label className="field"><span>{label}</span><input name={name} type={type} defaultValue={value ?? ""} placeholder={placeholder} required={!optional} /></label>;
}
