import { refreshLocationDatasetCache, saveLocationDatasetSettings, testLocationDataset } from "@/app/admin/actions";
import { getDatasetStats } from "@/lib/bangladesh-location-service";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function LocationDatasetPage({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  const params = await searchParams;
  const settings = await prisma.locationDatasetSetting.findUnique({ where: { singletonKey: "default" } }).catch(() => null);
  const stats = getDatasetStats();

  return (
    <div>
      <p className="kicker">Integrations</p>
      <h1>Bangladesh Location Dataset.</h1>
      <p className="admin-muted">Checkout address dropdowns use the local bangladesh-geojson package. No external runtime API or base URL is required.</p>
      {params.saved ? <div className="admin-success">Location dataset settings saved.</div> : null}

      <section className="order-metric-grid">
        <DatasetMetric label="Provider" value={stats.providerName} note={stats.providerType} />
        <DatasetMetric label="Status" value={stats.installed ? "Installed" : "Not installed"} note="Local package/data" />
        <DatasetMetric label="Divisions" value={stats.divisions.toLocaleString("en-BD")} note="Bangladesh divisions" />
        <DatasetMetric label="Districts" value={stats.districts.toLocaleString("en-BD")} note="Mapped to divisions" />
        <DatasetMetric label="Upazilas" value={stats.upazilas.toLocaleString("en-BD")} note="Mapped to districts" />
        <DatasetMetric label="Postcodes" value={stats.postcodes.toLocaleString("en-BD")} note="Post offices and postal codes" />
      </section>

      <section className="panel">
        <form action={saveLocationDatasetSettings} className="admin-form">
          <label className="field"><span>Cache duration (minutes)</span><input name="cacheDurationMinutes" type="number" min={1} max={10080} defaultValue={settings?.cacheDurationMinutes ?? 1440} /></label>
          <div className="admin-form-actions"><button className="btn">Save dataset settings</button></div>
        </form>

        <div className="location-api-status">
          <div>
            <strong>Last test</strong>
            <span>{settings?.lastTestAt ? settings.lastTestAt.toLocaleString("en-GB") : "Not tested yet"}</span>
          </div>
          <div>
            <strong>Status</strong>
            <span>{settings?.lastTestStatus ?? "No status yet."}</span>
          </div>
          <div>
            <strong>Last search</strong>
            <span>{settings?.lastSearchQuery ? `${settings.lastSearchQuery} (${settings.lastSearchResultCount} result(s))` : "No search tested yet."}</span>
          </div>
          {settings?.lastErrorMessage ? <div><strong>Last error</strong><span>{settings.lastErrorMessage}</span></div> : null}
        </div>

        <div className="admin-form-actions">
          <form action={testLocationDataset} className="inline-form">
            <input name="testQuery" placeholder="Search Dhaka, সিলেট, post office..." />
            <button className="btn secondary compact">Test search</button>
          </form>
          <form action={refreshLocationDatasetCache} className="inline-form">
            <button className="btn secondary compact">Refresh cache</button>
          </form>
        </div>
      </section>
    </div>
  );
}

function DatasetMetric({ label, value, note }: { label: string; value: string; note: string }) {
  return <article className="order-metric-card tone-sky"><span>BD</span><div><p>{label}</p><strong>{value}</strong><small>{note}</small></div></article>;
}
