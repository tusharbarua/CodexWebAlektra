import nodemailer from "nodemailer";
import type { Order, ThermalInspectionRequest } from "@prisma/client";
import { money } from "@/lib/format";

export async function sendOrderConfirmation(order: Order) {
  if (!process.env.SMTP_HOST || !order.customerEmail) return { skipped: true };

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: Number(process.env.SMTP_PORT ?? 587) === 465,
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }
      : undefined
  });

  await transporter.sendMail({
    from: process.env.SMTP_FROM ?? "Alektra Renewable <orders@alektraepc.com>",
    to: order.customerEmail,
    subject: `Alektra order ${order.orderNumber}`,
    text: `Thank you for your order ${order.orderNumber}.\nDelivery: ${order.deliveryLabel ?? order.deliveryMethod}\nDelivery charge: ${money(Number(order.deliveryBdt))}\nTotal: ${money(Number(order.totalBdt))}.`,
    html: `<p>Thank you for your order <strong>${order.orderNumber}</strong>.</p><p>Delivery: ${order.deliveryLabel ?? order.deliveryMethod}</p><p>Delivery charge: ${money(Number(order.deliveryBdt))}</p><p>Total: ${money(Number(order.totalBdt))}</p>`
  });

  return { skipped: false };
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
    secure: Number(process.env.SMTP_PORT ?? 587) === 465,
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD } : undefined
  });
}
