import { PublishStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

function withPolicyHeadingColons(content: string) {
  return content.replace(/^(\d+\.\s+[^:\n]+)$/gm, "$1:");
}

export const defaultTermsContent = withPolicyHeadingColons(`1. Scope
These Terms & Conditions apply only to purchases made through the Alektra Renewable online shop. EPC services, project installation works, engineering consultancy, thermal inspection, mapping, and other professional services may be governed by separate agreements, quotations, work orders, or contracts.

2. Product Information
We aim to display product descriptions, images, prices, stock status, and technical information as accurately as possible. Product images are for reference and may vary slightly from the actual product due to manufacturer updates, packaging changes, display settings, or batch variations. Customers are advised to review the model number, technical datasheet, and specifications before confirming an order.

3. Order Confirmation
Submitting an order through the website does not automatically guarantee product availability or final acceptance. Alektra Renewable may verify stock, pricing, delivery feasibility, and payment status before confirming dispatch. We reserve the right to cancel or modify an order if the product is unavailable, incorrectly priced, discontinued, restricted, or if payment is not received.

4. Pricing
All prices are shown in BDT unless otherwise stated. Prices may change without prior notice due to supplier price changes, import cost variation, currency fluctuation, tax/duty changes, or stock availability. The confirmed invoice or order confirmation will state the applicable amount payable.

5. Payment
Unless online payment is enabled, customers are required to pay by bank deposit, bank transfer, or another approved method communicated by Alektra Renewable. Customers must mention the order number clearly in the payment reference or deposit slip and send proof of payment by email or WhatsApp. Orders may not be processed or dispatched until payment is verified, unless Alektra Renewable approves otherwise.

6. Delivery and Pickup
Customers may choose courier delivery or warehouse pickup where available. Courier delivery charges, delivery time, and coverage depend on location, product type, weight, size, courier availability, and other operational factors. Pickup from warehouse is available only after confirmation from Alektra Renewable.

7. Inspection on Delivery
Customers should inspect the product, packaging, model number, quantity, and visible condition at the time of receiving. Any visible damage, wrong item, missing item, or packaging issue should be reported as soon as possible with photos, videos, and delivery documentation.

8. Installation and Use
Solar modules, inverters, batteries, cables, mounting systems, electrical equipment, and related products must be installed, commissioned, and operated by qualified and competent personnel. Alektra Renewable shall not be liable for loss, damage, fire, accident, injury, malfunction, warranty rejection, or performance issue caused by improper installation, incorrect wiring, poor earthing, overloading, unauthorized modification, unsuitable site condition, misuse, negligence, or failure to follow manufacturer instructions and applicable electrical standards.

9. Technical Suitability
Customers are responsible for ensuring that purchased products are suitable for their intended system, site condition, grid condition, load profile, battery compatibility, inverter compatibility, design, and regulatory requirements. Any free advice provided through the shop, phone, chat, email, or website is general guidance only and does not replace formal engineering design, site survey, or professional consultancy.

10. Warranty
Product warranty, if applicable, is provided according to the manufacturer’s warranty policy. Warranty coverage, duration, claim process, exclusions, and service timeline may vary by brand and product type. Alektra Renewable may assist with warranty claims where possible, but final approval, repair, replacement, or rejection may depend on the manufacturer, distributor, or authorized service center.

11. Limitation of Liability
To the maximum extent permitted by applicable law, Alektra Renewable shall not be liable for indirect, incidental, consequential, special, punitive, or business loss, including loss of profit, generation loss, production loss, downtime, data loss, equipment damage caused by third-party installation, or losses arising from misuse or improper system design.

12. Force Majeure
Alektra Renewable shall not be responsible for delay, non-delivery, or failure caused by circumstances beyond reasonable control, including natural disasters, fire, flood, cyclone, political unrest, strike, import delay, customs delay, courier disruption, supplier shortage, government restriction, utility interruption, or other force majeure events.

13. Order Cancellation
Customers may request order cancellation before payment verification, processing, or dispatch. Once a product has been dispatched, cancellation may not be possible. Customized, special-order, imported-on-demand, used, opened, installed, or configured products may not be eligible for cancellation except where required by applicable law.

14. Customer Information
Customers must provide accurate name, mobile number, email, delivery address, and payment information. Alektra Renewable shall not be responsible for delay, failed delivery, or wrong delivery caused by incorrect customer information.

15. Governing Law
These Terms & Conditions shall be governed by the laws of Bangladesh. Any dispute shall first be attempted to be resolved amicably. If unresolved, it shall be subject to the competent courts of Bangladesh.

16. Changes to Terms
Alektra Renewable may update these Terms & Conditions from time to time. The version accepted at the time of order placement will apply to that order.`);

export const defaultRefundContent = withPolicyHeadingColons(`1. Scope
This Refund, Return & Replacement Policy applies only to products purchased through the Alektra Renewable online shop. Project-based EPC works, installation services, inspection services, consultancy, customized engineering works, and special supply contracts may have separate refund or cancellation terms.

2. Return Eligibility
A return or replacement request may be considered if the delivered product is different from the confirmed order, physically damaged at delivery, defective on arrival, missing major accessories supplied by the manufacturer, or the product description/model does not materially match the confirmed order.

3. Reporting Timeline
Customers must report any return/replacement issue within 48 hours of receiving the product, unless a longer period is required by applicable law or manufacturer warranty. The report should include order number, customer name and mobile number, clear photos/videos, issue description, and delivery documentation if available.

4. Product Condition
To be eligible for return or replacement, the product should be unused, uninstalled, unmodified, and returned with original packaging, accessories, manuals, warranty cards, serial number labels, and invoice where applicable.

5. Non-Returnable Items
Used or installed products, cut-to-length cables, customized mounting structures, special-order products, products without serial/warranty labels, products damaged by misuse, clearance/final-sale items, and products returned without accessories, packaging, or proof of purchase may not be eligible for return or refund unless defective on arrival or incorrectly supplied.

6. Inspection and Approval
All return, refund, or replacement claims are subject to inspection and verification by Alektra Renewable, supplier, distributor, courier, or manufacturer where applicable.

7. Replacement
If a product is confirmed as wrong, damaged on arrival, or defective on arrival, Alektra Renewable may offer replacement subject to stock availability and verification. If the same product is unavailable, we may offer an equivalent alternative or refund, depending on the case.

8. Refund
Refunds, if approved, will be processed through bank transfer or the original payment method where possible. Courier charges, bank charges, payment gateway charges, and handling charges may be deducted where applicable, unless the issue was caused by Alektra Renewable or the supplied product was wrong/defective.

9. Warranty Claims
After the initial return reporting period, product issues will usually be handled under manufacturer warranty, if applicable. Warranty service may involve repair, replacement, or another remedy determined by the manufacturer/distributor.

10. Courier Damage
If a product appears damaged during courier delivery, the customer should document the condition immediately with photos/videos and inform Alektra Renewable as soon as possible.

11. Cancellation Before Dispatch
Customers may request cancellation before dispatch. If payment has already been made and the order has not been processed or dispatched, refund may be processed after verification.

12. No Refund for Improper Use or Installation
Alektra Renewable shall not be responsible for refund, replacement, accident, fire, equipment failure, or damage caused by improper installation, incorrect electrical design, incompatible equipment, poor site condition, negligence, misuse, unauthorized modification, or failure to follow manufacturer guidelines.

13. Contact for Return/Refund
For return, replacement, or refund requests, customers should contact contact@alektraepc.com and mention the order number in all communication.

14. Policy Updates
Alektra Renewable may update this policy from time to time. The policy version accepted at the time of order placement will apply to that order.`);

export async function getPublishedShopLegal(policyKey: "terms" | "refund") {
  const row = await prisma.shopLegalContent.findUnique({ where: { policyKey } }).catch(() => null);
  if (row?.status === PublishStatus.PUBLISHED) return row;
  return {
    id: policyKey,
    policyKey,
    title: policyKey === "terms" ? "Alektra Renewable Shop Terms & Conditions" : "Alektra Renewable Shop Refund, Return & Replacement Policy",
    slug: policyKey === "terms" ? "shop-terms" : "shop-refund-policy",
    content: policyKey === "terms" ? defaultTermsContent : defaultRefundContent,
    version: "v1.0",
    effectiveDate: null,
    status: PublishStatus.PUBLISHED,
    createdAt: new Date(),
    updatedAt: new Date()
  };
}
