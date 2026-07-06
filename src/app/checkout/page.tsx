import { prisma } from "@/lib/prisma";
import { CheckoutForm } from "@/components/CheckoutForm";
import { defaultRefundContent, defaultTermsContent } from "@/lib/shop-legal";

export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const [settings, checkoutSettings, terms, refund] = await Promise.all([
    prisma.ecommerceDeliverySetting.findUnique({ where: { singletonKey: "default" } }).catch(() => null),
    prisma.ecommerceCheckoutSetting.findUnique({ where: { singletonKey: "default" } }).catch(() => null),
    prisma.shopLegalContent.findUnique({ where: { policyKey: "terms" } }).catch(() => null),
    prisma.shopLegalContent.findUnique({ where: { policyKey: "refund" } }).catch(() => null)
  ]);
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
        }} checkoutSettings={{
          requireOtpVerification: checkoutSettings?.requireOtpVerification ?? false
        }} legalSettings={{
          termsVersion: terms?.version ?? "v1.0",
          termsTitle: terms?.title ?? "Alektra Renewable Shop Terms & Conditions",
          termsContent: terms?.content ?? defaultTermsContent,
          termsEffectiveDate: terms?.effectiveDate?.toISOString() ?? null,
          refundPolicyVersion: refund?.version ?? "v1.0",
          refundTitle: refund?.title ?? "Alektra Renewable Shop Refund, Return & Replacement Policy",
          refundContent: refund?.content ?? defaultRefundContent,
          refundEffectiveDate: refund?.effectiveDate?.toISOString() ?? null
        }} />
      </div>
    </main>
  );
}
