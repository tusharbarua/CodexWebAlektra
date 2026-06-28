import { CheckoutForm } from "@/components/CheckoutForm";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const settings = await prisma.ecommerceDeliverySetting.findUnique({ where: { singletonKey: "default" } }).catch(() => null);
  return (
    <main className="page-shell">
      <div className="container">
        <p className="kicker">Checkout</p>
        <h1>Confirm delivery and payment.</h1>
        <CheckoutForm deliverySettings={{
          courierEnabled: settings?.courierEnabled ?? true,
          courierMinimumChargeBdt: settings ? Number(settings.courierMinimumChargeBdt) : 200,
          pickupEnabled: settings?.pickupEnabled ?? true,
          pickupLabel: settings?.pickupLabel ?? "Pick up from our warehouse",
          pickupAddress: settings?.pickupAddress ?? "Khulshi, Chattogram",
          pickupChargeBdt: settings ? Number(settings.pickupChargeBdt) : 0
        }} />
      </div>
    </main>
  );
}
