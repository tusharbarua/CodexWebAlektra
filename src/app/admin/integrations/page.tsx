import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminIntegrationsPage() {
  const integrations = await prisma.monitoringIntegration.findMany({ orderBy: { updatedAt: "desc" } }).catch(() => []);

  return (
    <div>
      <p className="kicker">API Integrations</p>
      <h1>Inverter monitoring platforms.</h1>
      <div className="panel" style={{ margin: "20px 0" }}>
        <p>SolisCloud, Sungrow iSolarCloud, SMA Sunny Portal and generic providers are represented as connector adapters. Sync jobs append production readings to the impact ledger.</p>
      </div>
      <table className="table">
        <thead>
          <tr>
            <th>Label</th>
            <th>Provider</th>
            <th>Enabled</th>
            <th>Last sync</th>
          </tr>
        </thead>
        <tbody>
          {integrations.map((integration) => (
            <tr key={integration.id}>
              <td>{integration.label}</td>
              <td>{integration.provider}</td>
              <td>{integration.isEnabled ? "Yes" : "No"}</td>
              <td>{integration.lastSyncAt?.toLocaleString() ?? "Never"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
