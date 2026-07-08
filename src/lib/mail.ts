import nodemailer from "nodemailer";
import type { Order, OrderItem, ThermalInspectionRequest } from "@prisma/client";
import { money } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { renderPolicyPointsHtml, renderPolicyPointsText } from "@/lib/policy-format";

type OrderWithItems = Order & { items?: OrderItem[] };

export async function sendCustomerVerificationEmail(input: {
  email: string;
  fullName: string;
  token: string;
}) {
  if (!isSmtpConfigured()) return { skipped: true, status: "NOT_CONFIGURED" as const };
  const origin = appOrigin();
  const verifyUrl = `${origin}/account/verify-email?token=${encodeURIComponent(input.token)}`;
  const subject = "Verify your Alektra Renewable account";
  const html = `
    <div style="margin:0;padding:0;background:#f8fafc;font-family:Arial,Helvetica,sans-serif;color:#0f172a;">
      <div style="max-width:680px;margin:0 auto;padding:28px 16px;">
        <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:22px;overflow:hidden;box-shadow:0 18px 45px rgba(15,23,42,0.08);">
          <header style="padding:26px 28px;background:linear-gradient(135deg,#ecfdf5,#fef3c7);">
            <p style="margin:0;color:#047857;font-weight:700;letter-spacing:.08em;text-transform:uppercase;font-size:12px;">Alektra Renewable Account</p>
            <h1 style="margin:8px 0 4px;font-size:28px;line-height:1.15;">Verify your email</h1>
            <p style="margin:0;color:#475569;">Welcome, ${escapeHtml(input.fullName)}. Confirm your email to activate your customer account.</p>
          </header>
          <main style="padding:28px;">
            <p style="margin:0 0 18px;color:#475569;line-height:1.7;">Click the button below to verify your email address. This verification link expires in 24 hours.</p>
            <p style="margin:0 0 22px;"><a href="${verifyUrl}" style="display:inline-block;padding:13px 20px;border-radius:999px;background:linear-gradient(135deg,#006f35,#52b748);color:#ffffff;text-decoration:none;font-weight:700;">Verify Email</a></p>
            <p style="margin:0;color:#64748b;font-size:13px;line-height:1.6;">If the button does not work, copy and paste this link into your browser:<br><a href="${verifyUrl}" style="color:#047857;">${verifyUrl}</a></p>
            <p style="margin:18px 0 0;color:#64748b;font-size:13px;">If you did not create this account, you can safely ignore this email.</p>
          </main>
        </div>
      </div>
    </div>
  `;
  const text = `Verify your Alektra Renewable account

Welcome, ${input.fullName}.

Open this link within 24 hours to verify your email:
${verifyUrl}

If you did not create this account, ignore this email.`;
  await createTransport().sendMail({
    from: mailFrom(),
    to: input.email,
    subject,
    text,
    html
  });
  return { skipped: false, status: "SENT" as const };
}

export async function sendCustomerPasswordResetEmail(input: {
  email: string;
  fullName: string;
  token: string;
}) {
  if (!isSmtpConfigured()) return { skipped: true, status: "NOT_CONFIGURED" as const };
  const origin = appOrigin();
  const resetUrl = `${origin}/account/reset-password?token=${encodeURIComponent(input.token)}`;
  const subject = "Reset your Alektra Renewable account password";
  const html = customerActionEmail({
    title: "Reset your password",
    eyebrow: "Alektra Renewable Account",
    greeting: `Hello, ${escapeHtml(input.fullName)}.`,
    body: "Use the button below to reset your customer account password. This reset link expires in 1 hour.",
    buttonText: "Reset Password",
    url: resetUrl,
    note: "If you did not request this password reset, you can safely ignore this email."
  });
  const text = `Reset your Alektra Renewable account password

Hello, ${input.fullName}.

Open this link within 1 hour to reset your password:
${resetUrl}

If you did not request this password reset, ignore this email.`;
  await createTransport().sendMail({ from: mailFrom(), to: input.email, subject, text, html });
  return { skipped: false, status: "SENT" as const };
}

export async function sendCustomerAccountSetupEmail(input: {
  email: string;
  fullName: string;
  token: string;
  orderNumber?: string;
}) {
  if (!isSmtpConfigured()) return { skipped: true, status: "NOT_CONFIGURED" as const };
  const origin = appOrigin();
  const setupUrl = `${origin}/account/complete-setup?token=${encodeURIComponent(input.token)}`;
  const subject = "Complete your Alektra Renewable account";
  const html = customerActionEmail({
    title: "Complete your account",
    eyebrow: "Alektra Renewable Shop",
    greeting: `Thank you${input.orderNumber ? ` for order ${escapeHtml(input.orderNumber)}` : ""}, ${escapeHtml(input.fullName)}.`,
    body: "Set your password and verify your email to track this order, save delivery details, and manage your Alektra Renewable shop account.",
    buttonText: "Set Password & Verify Email",
    url: setupUrl,
    note: "This setup link expires in 24 hours. If you did not request an account, you can safely ignore this email."
  });
  const text = `Complete your Alektra Renewable account

Thank you${input.orderNumber ? ` for order ${input.orderNumber}` : ""}, ${input.fullName}.

Set your password and verify your email using this link within 24 hours:
${setupUrl}

If you did not request an account, ignore this email.`;
  await createTransport().sendMail({ from: mailFrom(), to: input.email, subject, text, html });
  return { skipped: false, status: "SENT" as const };
}

export async function sendOrderConfirmation(order: OrderWithItems) {
  if (!order.customerEmail) return { skipped: true, status: "NO_EMAIL" as const };
  if (!isSmtpConfigured()) return { skipped: true, status: "NOT_CONFIGURED" as const };

  const fullOrder = order.items?.length
    ? order
    : await prisma.order.findUnique({ where: { id: order.id }, include: { items: true } });
  if (!fullOrder?.customerEmail) return { skipped: true, status: "NO_EMAIL" as const };

  const { subject, text, html } = await renderOrderConfirmationEmail(fullOrder);
  const transporter = createTransport();

  await transporter.sendMail({
    from: mailFrom(),
    to: fullOrder.customerEmail,
    subject,
    text,
    html
  });

  return { skipped: false, status: "SENT" as const };
}

export async function sendOrderConfirmationEmail(orderId: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { items: true } });
  if (!order) throw new Error("Order not found.");
  return sendOrderConfirmation(order);
}

export async function renderOrderConfirmationEmail(order: OrderWithItems) {
  const [paymentSettings, terms, refund] = await Promise.all([
    getPaymentInstructionSettings(),
    getShopLegal("terms"),
    getShopLegal("refund")
  ]);
  const origin = appOrigin();
  const items = order.items ?? [];
  const address = addressText(order);
  const paymentEnabled = paymentSettings.manualBankTransferEnabled && paymentSettings.showBankInstructionInEmail;
  const policySummary = [
    "Please verify product model, quantity, and packaging at delivery.",
    "Installation must be performed by qualified personnel.",
    "Warranty is subject to manufacturer policy.",
    "Return/replacement claims must be reported with order number and proof.",
    "Alektra Renewable is not liable for damages caused by improper installation, misuse, unauthorized modification, poor earthing, surge/lightning, or incompatible system design."
  ];
  const policyDetailsBlock = `
    <section style="margin-top:18px;padding:16px;border-radius:16px;background:#ffffff;border:1px solid #e2e8f0;">
      <h2 style="margin:0 0 10px;font-size:18px;">Accepted Shop Terms & Conditions</h2>
      ${renderPolicyPointsHtml(terms.content)}
    </section>
    <section style="margin-top:12px;padding:16px;border-radius:16px;background:#ffffff;border:1px solid #e2e8f0;">
      <h2 style="margin:0 0 10px;font-size:18px;">Accepted Refund Policy</h2>
      ${renderPolicyPointsHtml(refund.content)}
    </section>
  `;
  const orderRows = items.map((item) => `
    <tr>
      <td style="padding:12px;border-bottom:1px solid #e5e7eb;"><strong>${escapeHtml(item.name)}</strong><br><span style="color:#64748b;font-size:12px;">${escapeHtml(item.sku)}</span></td>
      <td style="padding:12px;border-bottom:1px solid #e5e7eb;text-align:center;">${item.quantity}</td>
      <td style="padding:12px;border-bottom:1px solid #e5e7eb;text-align:right;">${money(Number(item.unitPriceBdt))}</td>
      <td style="padding:12px;border-bottom:1px solid #e5e7eb;text-align:right;"><strong>${money(Number(item.lineTotalBdt))}</strong></td>
    </tr>
  `).join("");

  const bankBlock = paymentEnabled ? `
    <section style="margin:24px 0;padding:20px;border-radius:18px;background:linear-gradient(135deg,#ecfdf5,#eff6ff);border:1px solid #bfdbfe;">
      <h2 style="margin:0 0 8px;color:#064e3b;font-size:20px;">Payment Instructions</h2>
      <p style="margin:0 0 16px;color:#334155;">Please deposit the payable amount to the following bank account:</p>
      <table style="width:100%;border-collapse:collapse;background:#ffffff;border-radius:14px;overflow:hidden;">
        ${bankRow("Account Name", paymentSettings.bankAccountName)}
        ${bankRow("Bank Name", paymentSettings.bankName)}
        ${bankRow("Branch", paymentSettings.branchName)}
        ${bankRow("Account Number", paymentSettings.accountNumber)}
        ${bankRow("Routing No.", paymentSettings.routingNumber)}
      </table>
      <div style="display:grid;gap:10px;margin-top:18px;">
        ${paymentStep("1", "Deposit to Bank")}
        ${paymentStep("2", "Write your Order Number clearly on the deposit slip or payment reference.")}
        ${paymentStep("3", "Send deposit slip / payment receipt by replying to this email or via WhatsApp.")}
      </div>
      <p style="margin:16px 0 0;color:#0f172a;">${escapeHtml(paymentSettings.paymentInstructionText)}</p>
      <p style="margin:8px 0 0;color:#475569;">Payment email: <a href="mailto:${escapeHtml(paymentSettings.paymentEmail)}" style="color:#047857;">${escapeHtml(paymentSettings.paymentEmail)}</a>${paymentSettings.whatsappNumber ? ` · WhatsApp: ${escapeHtml(paymentSettings.whatsappNumber)}` : ""}</p>
    </section>
  ` : "";

  const html = `
    <div style="margin:0;padding:0;background:#f8fafc;font-family:Arial,Helvetica,sans-serif;color:#0f172a;">
      <div style="max-width:760px;margin:0 auto;padding:28px 16px;">
        <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:22px;overflow:hidden;box-shadow:0 18px 45px rgba(15,23,42,0.08);">
          <header style="padding:26px 28px;background:linear-gradient(135deg,#ecfdf5,#dbeafe);">
            <p style="margin:0;color:#047857;font-weight:700;letter-spacing:.08em;text-transform:uppercase;font-size:12px;">Alektra Renewable Shop</p>
            <h1 style="margin:8px 0 4px;font-size:28px;line-height:1.15;">Order Confirmation</h1>
            <p style="margin:0;color:#475569;">Thank you, ${escapeHtml(order.customerName)}. We have received your order.</p>
          </header>
          <main style="padding:28px;">
            <div style="padding:18px;border-radius:18px;background:#0f172a;color:#ffffff;text-align:center;">
              <p style="margin:0 0 6px;color:#cbd5e1;">Your Order Number</p>
              <strong style="font-size:26px;letter-spacing:.03em;">${escapeHtml(order.orderNumber)}</strong>
            </div>
            <p style="margin:18px 0;color:#475569;">Order date: ${order.createdAt.toLocaleString("en-GB")}<br>Mobile: ${escapeHtml(order.customerPhone)}${order.customerEmail ? `<br>Email: ${escapeHtml(order.customerEmail)}` : ""}</p>
            <table style="width:100%;border-collapse:collapse;border:1px solid #e5e7eb;border-radius:14px;overflow:hidden;">
              <thead><tr style="background:#f1f5f9;color:#334155;"><th style="padding:12px;text-align:left;">Product</th><th style="padding:12px;">Qty</th><th style="padding:12px;text-align:right;">Unit price</th><th style="padding:12px;text-align:right;">Subtotal</th></tr></thead>
              <tbody>${orderRows || `<tr><td colspan="4" style="padding:12px;">Order items are being prepared.</td></tr>`}</tbody>
            </table>
            <div style="margin-top:18px;padding:16px;border-radius:16px;background:#f8fafc;border:1px solid #e2e8f0;">
              ${totalRow("Product subtotal", money(Number(order.subtotalBdt)))}
              ${totalRow("Delivery method", order.deliveryLabel ?? order.deliveryMethod)}
              ${totalRow("Delivery charge", money(Number(order.deliveryBdt)))}
              ${totalRow("Total payable", money(Number(order.totalBdt)), true)}
            </div>
            <section style="margin-top:18px;padding:16px;border-radius:16px;background:#ffffff;border:1px solid #e2e8f0;">
              <h2 style="margin:0 0 8px;font-size:18px;">Delivery / Pickup Information</h2>
              <p style="margin:0;color:#475569;white-space:pre-line;">${escapeHtml(address)}</p>
            </section>
            ${bankBlock}
            <section style="margin-top:18px;padding:16px;border-radius:16px;background:#f8fafc;border:1px solid #e2e8f0;">
              <h2 style="margin:0 0 8px;font-size:18px;">Terms & Refund Summary</h2>
              <ul style="margin:0 0 12px;padding-left:20px;color:#475569;">${policySummary.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
              <p style="margin:0;">Read: <a href="${origin}/shop/terms" style="color:#2563eb;">Shop Terms & Conditions</a> (${escapeHtml(terms.version)}) · <a href="${origin}/shop/refund-policy" style="color:#2563eb;">Refund Policy</a> (${escapeHtml(refund.version)})</p>
            </section>
            ${policyDetailsBlock}
          </main>
          <footer style="padding:20px 28px;background:#f1f5f9;color:#475569;">
            <p style="margin:0;">Need help? Reply to this email or contact Alektra Renewable at <a href="mailto:${escapeHtml(paymentSettings.paymentEmail)}" style="color:#047857;">${escapeHtml(paymentSettings.paymentEmail)}</a>.</p>
          </footer>
        </div>
      </div>
    </div>
  `;

  const text = `Alektra Renewable Order Confirmation - ${order.orderNumber}

Order number: ${order.orderNumber}
Customer: ${order.customerName}
Mobile: ${order.customerPhone}
Order date: ${order.createdAt.toLocaleString("en-GB")}

${items.map((item) => `${item.name} (${item.sku}) x ${item.quantity} - ${money(Number(item.lineTotalBdt))}`).join("\n")}

Subtotal: ${money(Number(order.subtotalBdt))}
Delivery: ${order.deliveryLabel ?? order.deliveryMethod} - ${money(Number(order.deliveryBdt))}
Total payable: ${money(Number(order.totalBdt))}

${address}

Payment:
Account Name: ${paymentSettings.bankAccountName}
Bank Name: ${paymentSettings.bankName}
Branch: ${paymentSettings.branchName}
Account Number: ${paymentSettings.accountNumber}
Routing No.: ${paymentSettings.routingNumber}

${paymentSettings.paymentInstructionText}

Terms: ${origin}/shop/terms
Refund Policy: ${origin}/shop/refund-policy

Accepted Shop Terms & Conditions:
${renderPolicyPointsText(terms.content)}

Accepted Refund Policy:
${renderPolicyPointsText(refund.content)}`;

  return {
    subject: `Alektra Renewable Order Confirmation - ${order.orderNumber}`,
    text,
    html
  };
}

export async function testSmtpConnection() {
  if (!isSmtpConfigured()) return { ok: false, message: "SMTP is not configured." };
  await createTransport().verify();
  return { ok: true, message: "SMTP connection verified." };
}

export async function sendThermalRequestEmails(request: ThermalInspectionRequest, pdfBytes: Uint8Array) {
  if (!process.env.SMTP_HOST) return { clientSent: false, adminSent: false };
  const transporter = createTransport();
  const location = request.projectFormattedAddress || request.projectLocation || request.manualAddressFallback || "Not provided";
  const coordinates = request.latitude && request.longitude ? `\nCoordinates: ${request.latitude}, ${request.longitude}` : "";
  const distance = request.distanceFromBaseKm ? `\nDistance from Alektra base: ${Number(request.distanceFromBaseKm).toFixed(2)} km` : "";
  const summary = `Request ${request.requestNumber}\nInspection: ${request.inspectionType}\nInstitution: ${request.institutionName}\nPV capacity: ${request.pvCapacityKwp} kWp\nAC capacity: ${request.acCapacityKw} kW\nLocation: ${location}${coordinates}${distance}\nDistance status: ${request.distanceCalculationStatus.replaceAll("_", " ")}`;
  await transporter.sendMail({
    from: process.env.SMTP_FROM ?? "Alektra Thermal <info@alektraepc.com>",
    to: request.email,
    subject: `Alektra Thermal request ${request.requestNumber}`,
    text: `Thank you for your thermal inspection request.\n\n${summary}\n\nOur team will review the request and contact you shortly.`,
    attachments: [{ filename: `${request.requestNumber}.pdf`, content: Buffer.from(pdfBytes) }]
  });
  const adminTo = process.env.ADMIN_NOTIFICATION_EMAIL ?? process.env.ADMIN_EMAIL;
  if (adminTo) await transporter.sendMail({
    from: process.env.SMTP_FROM ?? "Alektra Thermal <info@alektraepc.com>",
    to: adminTo,
    subject: `New thermal inspection request ${request.requestNumber}`,
    text: summary,
    attachments: [{ filename: `${request.requestNumber}.pdf`, content: Buffer.from(pdfBytes) }]
  });
  return { clientSent: true, adminSent: Boolean(adminTo) };
}

export async function sendThermalPaymentRequestEmail(request: ThermalInspectionRequest, pdfBytes: Uint8Array) {
  if (!process.env.SMTP_HOST || !request.calculatedFeeBdt) return { clientSent: false, adminSent: false };
  const transporter = createTransport();
  const origin = process.env.NEXTAUTH_URL ?? process.env.APP_URL ?? "https://www.alektraepc.com";
  const requestUrl = `${origin.replace(/\/$/, "")}/thermal/inspection-request/success?request=${encodeURIComponent(request.requestNumber)}`;
  const fee = Number(request.calculatedFeeBdt).toLocaleString("en-BD");
  await transporter.sendMail({
    from: process.env.SMTP_FROM ?? "Alektra Thermal <info@alektraepc.com>",
    to: request.email,
    subject: `Payment requested for ${request.requestNumber}`,
    text: `Your Alektra Thermal inspection request has been reviewed.\n\nInspection fee: BDT ${fee}\nRequest: ${request.requestNumber}\n\nReview the quotation and pay securely when ready: ${requestUrl}`,
    html: `<p>Your Alektra Thermal inspection request <strong>${request.requestNumber}</strong> has been reviewed.</p><p>Inspection fee: <strong>BDT ${fee}</strong></p><p><a href="${requestUrl}">Review request and pay securely</a></p>`,
    attachments: [{ filename: `${request.requestNumber}-quotation.pdf`, content: Buffer.from(pdfBytes) }]
  });
  const adminTo = process.env.ADMIN_NOTIFICATION_EMAIL ?? process.env.ADMIN_EMAIL;
  if (adminTo) await transporter.sendMail({
    from: process.env.SMTP_FROM ?? "Alektra Thermal <info@alektraepc.com>",
    to: adminTo,
    subject: `Payment request issued for ${request.requestNumber}`,
    text: `A payment request for BDT ${fee} was issued to ${request.email}.`,
    attachments: [{ filename: `${request.requestNumber}-quotation.pdf`, content: Buffer.from(pdfBytes) }]
  });
  return { clientSent: true, adminSent: Boolean(adminTo) };
}

export async function sendThermalPaymentConfirmationEmail(request: ThermalInspectionRequest, pdfBytes: Uint8Array) {
  if (!process.env.SMTP_HOST || !request.calculatedFeeBdt) return { clientSent: false, adminSent: false };
  const transporter = createTransport();
  const fee = Number(request.calculatedFeeBdt).toLocaleString("en-BD");
  const transaction = request.sslTransactionId ? ` Transaction reference: ${request.sslTransactionId}.` : "";
  await transporter.sendMail({
    from: process.env.SMTP_FROM ?? "Alektra Thermal <info@alektraepc.com>",
    to: request.email,
    subject: `Payment received for ${request.requestNumber}`,
    text: `We have received BDT ${fee} for request ${request.requestNumber}.${transaction} Our team will contact you to arrange the inspection.`,
    attachments: [{ filename: `${request.requestNumber}-payment-receipt.pdf`, content: Buffer.from(pdfBytes) }]
  });
  const adminTo = process.env.ADMIN_NOTIFICATION_EMAIL ?? process.env.ADMIN_EMAIL;
  if (adminTo) await transporter.sendMail({
    from: process.env.SMTP_FROM ?? "Alektra Thermal <info@alektraepc.com>",
    to: adminTo,
    subject: `Thermal inspection payment received: ${request.requestNumber}`,
    text: `Payment of BDT ${fee} has been recorded for ${request.requestNumber}.${transaction}`,
    attachments: [{ filename: `${request.requestNumber}-payment-receipt.pdf`, content: Buffer.from(pdfBytes) }]
  });
  return { clientSent: true, adminSent: Boolean(adminTo) };
}

function createTransport() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: smtpSecure(),
    requireTLS: process.env.SMTP_REQUIRE_TLS === "true",
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: smtpPassword() } : undefined
  });
}

function isSmtpConfigured() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && smtpPassword());
}

function smtpPassword() {
  return process.env.SMTP_PASS ?? process.env.SMTP_PASSWORD;
}

function smtpSecure() {
  if (process.env.SMTP_SECURE) return process.env.SMTP_SECURE === "true";
  return Number(process.env.SMTP_PORT ?? 587) === 465;
}

function mailFrom() {
  const email = process.env.MAIL_FROM_EMAIL || process.env.SMTP_USER || "contact@alektraepc.com";
  const name = process.env.MAIL_FROM_NAME || "Alektra Renewable";
  return process.env.SMTP_FROM || `${name} <${email}>`;
}

function appOrigin() {
  return (process.env.NEXTAUTH_URL ?? process.env.APP_URL ?? "https://www.alektraepc.com").replace(/\/$/, "");
}

function customerActionEmail(input: {
  eyebrow: string;
  title: string;
  greeting: string;
  body: string;
  buttonText: string;
  url: string;
  note: string;
}) {
  return `
    <div style="margin:0;padding:0;background:#f7fff8;font-family:Arial,Helvetica,sans-serif;color:#102a1f;">
      <div style="max-width:680px;margin:0 auto;padding:28px 16px;">
        <div style="background:#ffffff;border:1px solid #dbeadf;border-radius:22px;overflow:hidden;box-shadow:0 18px 45px rgba(16,42,31,0.10);">
          <header style="padding:26px 28px;background:linear-gradient(135deg,#ecfdf5,#fef3c7);">
            <p style="margin:0;color:#047857;font-weight:700;letter-spacing:.08em;text-transform:uppercase;font-size:12px;">${escapeHtml(input.eyebrow)}</p>
            <h1 style="margin:8px 0 4px;font-size:28px;line-height:1.15;color:#063b22;">${escapeHtml(input.title)}</h1>
            <p style="margin:0;color:#475569;">${input.greeting}</p>
          </header>
          <main style="padding:28px;">
            <p style="margin:0 0 18px;color:#475569;line-height:1.7;">${escapeHtml(input.body)}</p>
            <p style="margin:0 0 22px;"><a href="${input.url}" style="display:inline-block;padding:13px 20px;border-radius:999px;background:linear-gradient(135deg,#006f35,#52b748);color:#ffffff;text-decoration:none;font-weight:700;">${escapeHtml(input.buttonText)}</a></p>
            <p style="margin:0;color:#64748b;font-size:13px;line-height:1.6;">If the button does not work, copy and paste this link into your browser:<br><a href="${input.url}" style="color:#047857;">${input.url}</a></p>
            <p style="margin:18px 0 0;color:#64748b;font-size:13px;">${escapeHtml(input.note)}</p>
          </main>
        </div>
      </div>
    </div>
  `;
}

async function getPaymentInstructionSettings() {
  const [settings, site] = await Promise.all([
    prisma.paymentInstructionSetting.findUnique({ where: { singletonKey: "default" } }).catch(() => null),
    prisma.siteSettings.findUnique({ where: { singletonKey: "footer" } }).catch(() => null)
  ]);
  return {
    manualBankTransferEnabled: settings?.manualBankTransferEnabled ?? true,
    showBankInstructionInEmail: settings?.showBankInstructionInEmail ?? true,
    bankAccountName: settings?.bankAccountName ?? "ALEKTRA RENEWABLE",
    bankName: settings?.bankName ?? "Dutch Bangla Bank Ltd",
    branchName: settings?.branchName ?? "OR Nizam Road",
    accountNumber: settings?.accountNumber ?? "1291100024117",
    routingNumber: settings?.routingNumber ?? "090151480",
    paymentInstructionText: settings?.paymentInstructionText ?? "After completing payment, please reply to this email with your deposit slip/payment receipt, or send it to our WhatsApp. Please write your order number clearly so that we can trace your payment quickly.",
    paymentEmail: settings?.paymentEmail ?? "contact@alektraepc.com",
    whatsappNumber: settings?.whatsappNumber ?? site?.whatsappNumber ?? null
  };
}

async function getShopLegal(policyKey: string) {
  const row = await prisma.shopLegalContent.findUnique({ where: { policyKey } }).catch(() => null);
  return {
    version: row?.version ?? "v1.0",
    title: row?.title ?? (policyKey === "terms" ? "Alektra Renewable Shop Terms & Conditions" : "Alektra Renewable Shop Refund, Return & Replacement Policy"),
    content: row?.content ?? ""
  };
}

function addressText(order: Order) {
  const address = order.shippingAddress && typeof order.shippingAddress === "object" && !Array.isArray(order.shippingAddress)
    ? order.shippingAddress as Record<string, unknown>
    : {};
  if (address.pickupAddress) return `Pickup from: ${String(address.pickupAddress)}`;
  return [
    address.addressLine || address.line1,
    [address.upazilaName || address.city || address.thanaName, address.districtName || address.district, address.divisionName].filter(Boolean).join(", "),
    address.postOffice || address.postalCode ? `Post office / postal code: ${[address.postOffice, address.postalCode].filter(Boolean).join(" - ")}` : "",
    address.deliveryNotes ? `Notes: ${address.deliveryNotes}` : ""
  ].filter(Boolean).map(String).join("\n");
}

function bankRow(label: string, value: string) {
  return `<tr><td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;color:#64748b;">${escapeHtml(label)}</td><td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;font-weight:700;color:#0f172a;">${escapeHtml(value)}</td></tr>`;
}

function paymentStep(number: string, label: string) {
  return `<div style="display:flex;gap:10px;align-items:center;padding:10px 12px;border-radius:12px;background:rgba(255,255,255,.78);"><span style="width:26px;height:26px;border-radius:999px;background:#047857;color:white;display:inline-flex;align-items:center;justify-content:center;font-weight:700;">${number}</span><strong style="color:#0f172a;">${escapeHtml(label)}</strong></div>`;
}

function totalRow(label: string, value: string, strong = false) {
  return `<div style="display:flex;justify-content:space-between;gap:14px;padding:7px 0;${strong ? "font-size:18px;border-top:1px solid #e2e8f0;margin-top:6px;padding-top:12px;" : ""}"><span style="color:#64748b;">${escapeHtml(label)}</span><strong style="color:#0f172a;">${escapeHtml(value)}</strong></div>`;
}

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
