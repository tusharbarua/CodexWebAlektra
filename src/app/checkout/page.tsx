import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { CheckoutForm } from "@/components/CheckoutForm";
import { defaultRefundContent, defaultTermsContent } from "@/lib/shop-legal";
import { getCustomerSession } from "@/lib/customer-auth";

export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const customer = await getCustomerSession();
  const [settings, checkoutSettings, terms, refund, savedAddresses] = await Promise.all([
    prisma.ecommerceDeliverySetting.findUnique({ where: { singletonKey: "default" } }).catch(() => null),
    prisma.ecommerceCheckoutSetting.findUnique({ where: { singletonKey: "default" } }).catch(() => null),
    prisma.shopLegalContent.findUnique({ where: { policyKey: "terms" } }).catch(() => null),
    prisma.shopLegalContent.findUnique({ where: { policyKey: "refund" } }).catch(() => null),
    customer ? prisma.customerAddress.findMany({ where: { customerId: customer.id }, orderBy: [{ isDefault: "desc" }, { updatedAt: "desc" }] }) : []
  ]);
  return (
    <main className="page-shell checkout-page">
      <div className="container">
        <div className="checkout-page-heading">
          <div>
            <p className="kicker">Checkout</p>
            <h1>Confirm delivery and payment.</h1>
          </div>
          <Link className="checkout-continue-shopping" href="/shop">← Continue Shopping</Link>
        </div>
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
        }} customerProfile={customer ? {
          fullName: customer.fullName,
          email: customer.email,
          mobileNumber: customer.mobileNumber
        } : null} savedAddresses={savedAddresses.map((address) => ({
          id: address.id,
          recipientName: address.recipientName,
          mobileNumber: address.mobileNumber,
          divisionId: address.divisionId,
          divisionName: address.divisionName,
          districtId: address.districtId,
          districtName: address.districtName,
          upazilaId: address.upazilaId,
          upazilaName: address.upazilaName,
          addressLine: address.addressLine,
          postalCode: address.postalCode,
          deliveryNotes: address.deliveryNotes,
          isDefault: address.isDefault
        }))} />
      </div>
    </main>
  );
}
