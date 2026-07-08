import { PublishStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type LegalDocumentKey = "privacy" | "terms-of-use" | "sales-and-refunds" | "legal";

export type PublicLegalDocument = {
  documentKey: LegalDocumentKey;
  title: string;
  slug: string;
  content: string;
  version: string;
  effectiveDate: string | null;
};

type LegalDefault = {
  documentKey: LegalDocumentKey;
  title: string;
  slug: string;
  content: string;
  description: string;
};

function withHeadingColons(content: string) {
  return content.replace(/^(\d+\.\s+[^:\n]+)$/gm, "$1:");
}

export const legalDefaults: Record<LegalDocumentKey, LegalDefault> = {
  privacy: {
    documentKey: "privacy",
    title: "Privacy Policy",
    slug: "privacy-policy",
    description: "How Alektra Renewable collects, uses, stores, and protects website, shop, and service request information.",
    content: withHeadingColons(`1. Scope
This Privacy Policy explains how Alektra Renewable collects, uses, stores, and protects information when visitors, customers, service-request clients, and business partners use our website, shop, forms, and online services.

2. Information We Collect
We may collect information such as name, company or institution name, email address, mobile number, billing or delivery address, project location, product order details, service request information, uploaded files, payment confirmation details, technical device information, browser data, and communication records.

3. Use of Information
We use collected information to process orders, respond to inquiries, provide quotations, manage service requests, arrange delivery or pickup, verify payments, send order confirmations, provide technical support, improve our website, maintain records, and comply with applicable legal or regulatory obligations.

4. Payment Information
Alektra Renewable does not ask customers to submit online card details directly on our website unless an approved payment gateway is integrated. For manual bank payments, customers may send deposit slips or payment receipts by email or WhatsApp for verification.

5. Service Request Information
Information submitted through Thermal, Sparkle, Mapping, or EPC service request forms may be used to evaluate project feasibility, contact the client, prepare proposals, schedule site visits, and maintain internal project records.

6. Cookies and Analytics
Our website may use cookies, analytics tools, session storage, or similar technologies to improve user experience, measure website performance, remember preferences, secure forms, and understand visitor behavior. Users may disable cookies in their browser, but some features may not work properly.

7. Sharing of Information
We do not sell customer personal information. We may share necessary information with trusted service providers such as courier companies, payment processors, hosting providers, email/SMS/WhatsApp service providers, technical support vendors, auditors, legal advisers, or regulatory authorities where required.

8. International Tools and Hosting
Some website, hosting, analytics, communication, or software tools may process or store data outside Bangladesh. By using our website or submitting information, users acknowledge that such processing may occur where necessary for service delivery, security, communication, or technical operation.

9. Data Security
We take reasonable administrative, technical, and organizational measures to protect user information from unauthorized access, misuse, loss, alteration, or disclosure. However, no internet-based system is completely risk-free, and users should avoid sharing unnecessary sensitive information through public or insecure channels.

10. Data Retention
We retain information for as long as necessary to provide services, process orders, maintain business records, comply with legal obligations, resolve disputes, enforce agreements, and support warranty or after-sales communication.

11. User Rights and Requests
Users may contact Alektra Renewable to request correction, update, or deletion of their personal information, subject to legal, contractual, accounting, warranty, security, and legitimate business record requirements.

12. Children's Privacy
Our website and services are intended for business, professional, and general customer use and are not directed toward children. We do not knowingly collect information from children without appropriate consent.

13. Third-Party Links
Our website may contain links to third-party websites, manufacturer datasheets, payment platforms, courier services, maps, videos, or external resources. Alektra Renewable is not responsible for the privacy practices, content, or security of third-party websites.

14. Policy Updates
We may update this Privacy Policy from time to time. The latest version will be published on our website with an effective date.

15. Contact
For privacy-related questions, please contact Alektra Renewable at contact@alektraepc.com.`)
  },
  "terms-of-use": {
    documentKey: "terms-of-use",
    title: "Terms of Use",
    slug: "terms-of-use",
    description: "Terms for accessing and using the Alektra Renewable website, shop, resources, and online tools.",
    content: withHeadingColons(`1. Acceptance of Terms
By accessing or using the Alektra Renewable website, shop, service request forms, downloadable resources, or online tools, users agree to these Terms of Use. If a user does not agree, they should not use the website.

2. Website Purpose
This website provides information about Alektra Renewable, its subdivisions, products, services, project capabilities, shop items, and service request options. Website content is provided for general information and business communication purposes.

3. No Final Engineering Advice
Information on the website does not replace formal engineering design, site survey, project-specific quotation, grid study, safety assessment, or professional consultancy. Solar, electrical, battery, mapping, cleaning, and inspection decisions should be made based on project-specific review by competent professionals.

4. User Responsibility
Users are responsible for providing accurate information in forms, orders, service requests, and communications. Alektra Renewable shall not be responsible for delays, incorrect quotations, delivery problems, or failed communication caused by inaccurate or incomplete user information.

5. Product and Service Information
We try to keep product, service, pricing, stock, specification, and project information accurate and updated. However, information may change due to supplier updates, market conditions, currency fluctuation, technical revision, regulatory changes, or human error.

6. Intellectual Property
All website content, including text, design, graphics, logos, icons, images, videos, documents, software elements, layouts, and branding, is owned by or licensed to Alektra Renewable unless otherwise stated. Users may not copy, reproduce, modify, distribute, or commercially use such content without written permission.

7. Permitted Use
Users may browse the website, submit genuine inquiries, place legitimate orders, request services, download available resources, and communicate with Alektra Renewable for lawful purposes only.

8. Prohibited Use
Users must not misuse the website, attempt unauthorized access, upload harmful files, interfere with security, scrape data without permission, impersonate others, submit false orders, violate applicable laws, or use the website for fraudulent or harmful activities.

9. Third-Party Content
The website may reference manufacturers, datasheets, videos, maps, software tools, payment services, courier services, or external websites. Alektra Renewable does not control third-party content and is not responsible for their accuracy, availability, or policies.

10. Limitation of Liability
To the maximum extent permitted by applicable law, Alektra Renewable shall not be liable for indirect, incidental, consequential, special, punitive, business, profit, production, generation, data, or downtime losses arising from website use, reliance on website information, technical errors, or service interruptions.

11. Service Availability
We may update, suspend, restrict, or discontinue any website feature, page, product listing, service request form, or online service at any time without prior notice.

12. Governing Law
These Terms of Use are governed by the laws of Bangladesh, unless a separate written agreement states otherwise. Any dispute shall first be attempted to be resolved amicably and, if unresolved, may be submitted to competent courts of Bangladesh.

13. Changes to Terms
Alektra Renewable may update these Terms of Use from time to time. Continued use of the website after updates means the user accepts the revised terms.

14. Contact
For questions about these Terms of Use, contact us at contact@alektraepc.com.`)
  },
  "sales-and-refunds": {
    documentKey: "sales-and-refunds",
    title: "Sales and Refunds",
    slug: "sales-and-refunds",
    description: "Sales, delivery, return, replacement, refund, and warranty communication terms for Alektra Renewable shop purchases.",
    content: withHeadingColons(`1. Scope
This Sales and Refunds policy applies to products purchased through the Alektra Renewable online shop and related online sales communication. Project-based EPC works, consultancy, inspection services, mapping services, cleaning services, custom engineering, and separately contracted works may be governed by separate agreements, quotations, or work orders.

2. Order Placement
Placing an order on the website does not automatically guarantee final acceptance, dispatch, or stock availability. Alektra Renewable may verify stock, pricing, delivery feasibility, customer details, and payment before processing an order.

3. Pricing
Product prices are shown in BDT unless otherwise stated. Prices may change due to supplier price changes, import cost, currency fluctuation, duty/tax changes, stock availability, or technical error. If an error is identified, Alektra Renewable may contact the customer to confirm, revise, or cancel the order.

4. Payment
Unless online payment is enabled, customers may be required to pay by bank deposit, bank transfer, or another approved method communicated by Alektra Renewable. Customers must mention the order number clearly in the payment reference or deposit slip and send payment proof by email or WhatsApp.

5. Order Processing
Orders may be processed only after payment verification unless Alektra Renewable approves otherwise. Delivery or pickup timing may vary depending on stock, payment verification, courier availability, product size, location, and operational conditions.

6. Delivery and Pickup
Customers may choose courier delivery or pickup where available. Delivery charges, coverage, timeline, and handling may depend on product weight, size, destination, courier policy, and site accessibility. Warehouse pickup is available only after confirmation.

7. Inspection at Delivery
Customers should inspect product model, quantity, package condition, and visible damage at the time of delivery or pickup. Any visible issue should be reported promptly with photos, videos, delivery documents, and order number.

8. Return Eligibility
A return, replacement, or refund request may be considered if the delivered product is wrong, physically damaged at delivery, defective on arrival, missing major manufacturer-supplied accessories, or materially different from the confirmed order.

9. Reporting Timeline
Customers should report return, refund, or replacement issues within 48 hours of receiving the product unless a longer period is required by applicable law or manufacturer warranty. The report must include the order number, customer name, mobile number, issue description, and clear photos/videos.

10. Product Condition
Returned products should be unused, uninstalled, unmodified, and returned with original packaging, accessories, manuals, warranty cards, serial number labels, and invoice where applicable.

11. Non-Returnable Items
Used, installed, modified, cut-to-length, customized, imported-on-demand, special-order, clearance, final-sale, or physically damaged-by-customer products may not be eligible for return or refund unless incorrectly supplied or defective on arrival.

12. Inspection and Approval
All refund, return, or replacement claims are subject to verification by Alektra Renewable, supplier, distributor, courier, or manufacturer where applicable. Receiving a complaint does not automatically guarantee refund or replacement.

13. Refund Method
Approved refunds may be processed by bank transfer or another suitable method after verification. Courier charges, bank charges, gateway charges, and handling charges may be deducted where applicable, unless the issue was caused by Alektra Renewable or the supplied product was wrong or defective.

14. Warranty Claims
After the initial return reporting period, product problems may be handled under manufacturer warranty where applicable. Warranty approval, repair, replacement, timeline, and exclusions depend on manufacturer, distributor, or authorized service center policy.

15. No Refund for Improper Installation or Misuse
Alektra Renewable shall not be liable for refund, replacement, accident, fire, equipment failure, performance loss, or damage caused by improper installation, incorrect wiring, poor earthing, surge, lightning, water ingress, overload, incompatible system design, misuse, negligence, unauthorized repair, or failure to follow manufacturer instructions.

16. Cancellation Before Dispatch
Customers may request cancellation before payment verification, processing, or dispatch. If the product has already been dispatched or specially procured, cancellation may not be possible and return terms may apply.

17. Consumer Rights
Nothing in this policy is intended to exclude rights that cannot be excluded under applicable Bangladesh law.

18. Contact
For sales, refund, return, or replacement questions, contact contact@alektraepc.com and mention the order number clearly.`)
  },
  legal: {
    documentKey: "legal",
    title: "Legal Notice",
    slug: "legal",
    description: "Company identity, professional disclaimers, intellectual property, liability, external links, and governing law notices.",
    content: withHeadingColons(`1. Company Identity
This website is operated by Alektra Renewable. References to "Alektra Renewable," "Alektra," "we," "our," or "us" refer to Alektra Renewable and its relevant service divisions, unless the context requires otherwise.

2. Subdivision Information
Alektra EPC, Alektra Thermal, Alektra Sparkle, and Alektra Mapping represent service divisions or business activities under the Alektra Renewable brand. Specific services may be subject to separate quotation, proposal, contract, or technical scope.

3. Professional Disclaimer
Website content is provided for general information only. It does not constitute final engineering advice, legal advice, financial advice, warranty assurance, technical certification, or a binding project commitment unless confirmed in a written agreement issued by Alektra Renewable.

4. Technical Accuracy
Solar, electrical, battery, drone, mapping, thermal inspection, cleaning, and energy-related information may depend on site condition, design assumptions, equipment selection, manufacturer guidelines, weather, utility policy, standards, and regulatory requirements. Final decisions should be made after project-specific review.

5. Safety Disclaimer
Electrical, solar, battery, inverter, mounting, drone, rooftop, and industrial works involve safety risks. Products and services must be handled, installed, operated, and maintained by competent and qualified personnel following applicable laws, standards, manufacturer manuals, and safety procedures.

6. Third-Party Brands
Manufacturer names, product images, datasheets, logos, software names, and trademarks may belong to their respective owners. Their appearance on this website does not imply endorsement unless explicitly stated.

7. Limitation of Liability
To the maximum extent permitted by law, Alektra Renewable shall not be liable for indirect, incidental, consequential, special, punitive, business, profit, generation, production, downtime, equipment, data, or financial losses arising from website use, product misuse, improper installation, third-party services, or reliance on general website information.

8. External Links
This website may include links to third-party websites, maps, videos, payment platforms, courier services, manufacturer resources, or software tools. Alektra Renewable is not responsible for external content, availability, accuracy, privacy practices, or security.

9. Intellectual Property
Website materials, design, text, graphics, videos, documents, logos, and software elements are protected by applicable intellectual property laws. Unauthorized copying, scraping, redistribution, modification, or commercial use is prohibited.

10. Force Majeure
Alektra Renewable shall not be responsible for delays, non-performance, website interruption, delivery disruption, or service failure caused by events beyond reasonable control, including natural disaster, fire, flood, cyclone, political unrest, strike, import delay, customs delay, courier disruption, supplier shortage, cyber incident, government restriction, utility interruption, or other force majeure events.

11. Governing Law
This Legal Notice shall be governed by the laws of Bangladesh unless a separate written agreement states otherwise.

12. Updates
Alektra Renewable may update this Legal Notice from time to time. The latest version will be available on the website.`)
  }
};

const orderedKeys: LegalDocumentKey[] = ["privacy", "terms-of-use", "sales-and-refunds", "legal"];

function fallbackDocument(key: LegalDocumentKey): PublicLegalDocument {
  const current = legalDefaults[key];
  return {
    documentKey: current.documentKey,
    title: current.title,
    slug: current.slug,
    content: current.content,
    version: "v1.0",
    effectiveDate: null
  };
}

function toPublicDocument(row: {
  documentKey: string;
  title: string;
  slug: string;
  content: string;
  version: string;
  effectiveDate: Date | null;
}): PublicLegalDocument {
  return {
    documentKey: row.documentKey as LegalDocumentKey,
    title: row.title,
    slug: row.slug,
    content: row.content,
    version: row.version,
    effectiveDate: row.effectiveDate ? row.effectiveDate.toISOString() : null
  };
}

export async function getPublishedLegalDocument(key: LegalDocumentKey) {
  const row = await prisma.legalDocument.findUnique({ where: { documentKey: key } }).catch(() => null);
  if (row?.status === PublishStatus.PUBLISHED) return toPublicDocument(row);
  return fallbackDocument(key);
}

export async function getFooterLegalDocuments() {
  const rows = await prisma.legalDocument.findMany({
    where: { documentKey: { in: orderedKeys }, status: PublishStatus.PUBLISHED }
  }).catch(() => []);
  return orderedKeys.map((key) => {
    const row = rows.find((item) => item.documentKey === key);
    return row ? toPublicDocument(row) : fallbackDocument(key);
  });
}

export async function getLegalDocumentBySlug(slug: string) {
  const defaultEntry = Object.values(legalDefaults).find((item) => item.slug === slug);
  if (!defaultEntry) return null;
  return getPublishedLegalDocument(defaultEntry.documentKey);
}

export function getLegalDefaultDescription(key: LegalDocumentKey) {
  return legalDefaults[key].description;
}

export function getSiteMapGroups() {
  return [
    {
      title: "Alektra Renewable",
      links: [
        { label: "Home", href: "/" },
        { label: "Contact", href: "/#contact" }
      ]
    },
    {
      title: "Services",
      links: [
        { label: "Alektra EPC", href: "/" },
        { label: "Alektra Thermal", href: "/thermal" },
        { label: "Alektra Sparkle", href: "/sparkle" },
        { label: "Alektra Mapping", href: "/mapping" }
      ]
    },
    {
      title: "Shop",
      links: [
        { label: "Shop", href: "/shop" },
        { label: "Cart", href: "/cart" },
        { label: "Checkout", href: "/checkout" },
        { label: "Shop Terms & Conditions", href: "/shop/terms" },
        { label: "Refund Policy", href: "/shop/refund-policy" }
      ]
    },
    {
      title: "Legal",
      links: [
        { label: "Privacy Policy", href: "/privacy-policy" },
        { label: "Terms of Use", href: "/terms-of-use" },
        { label: "Sales and Refunds", href: "/sales-and-refunds" },
        { label: "Legal Notice", href: "/legal" },
        { label: "Site Map", href: "/site-map" }
      ]
    },
    {
      title: "Resources",
      links: [
        { label: "Resources", href: "/resources" }
      ]
    }
  ];
}
