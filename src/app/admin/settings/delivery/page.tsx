import { saveDeliverySettings } from "@/app/admin/actions";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function DeliverySettingsPage({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  const params = await searchParams;
  const settings = await prisma.ecommerceDeliverySetting.findUnique({ where: { singletonKey: "default" } }).catch(() => null);
  return (
    <div>
      <p className="kicker">Ecommerce</p>
      <h1>Delivery settings.</h1>
      {params.saved ? <div className="admin-success">Delivery settings saved.</div> : null}
      <form action={saveDeliverySettings} className="panel admin-form">
        <label className="check-field"><input type="checkbox" name="courierEnabled" defaultChecked={settings?.courierEnabled ?? true} /> Enable courier delivery</label>
        <label className="field"><span>Courier minimum charge (BDT)</span><input name="courierMinimumChargeBdt" type="number" min="0" defaultValue={settings ? Number(settings.courierMinimumChargeBdt) : 200} required /></label>
        <label className="check-field"><input type="checkbox" name="pickupEnabled" defaultChecked={settings?.pickupEnabled ?? true} /> Enable warehouse pickup</label>
        <label className="field"><span>Pickup label</span><input name="pickupLabel" defaultValue={settings?.pickupLabel ?? "Pick up from our warehouse"} required /></label>
        <label className="field wide"><span>Pickup address</span><input name="pickupAddress" defaultValue={settings?.pickupAddress ?? "Khulshi, Chattogram"} required /></label>
        <div className="admin-form-actions"><button className="btn">Save delivery settings</button></div>
      </form>
    </div>
  );
}
