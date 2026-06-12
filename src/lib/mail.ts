import nodemailer from "nodemailer";
import type { Order } from "@prisma/client";

export async function sendOrderConfirmation(order: Order) {
  if (!process.env.SMTP_HOST) return { skipped: true };

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
    text: `Thank you for your order ${order.orderNumber}. Total: BDT ${order.totalBdt}.`,
    html: `<p>Thank you for your order <strong>${order.orderNumber}</strong>.</p><p>Total: BDT ${order.totalBdt}</p>`
  });

  return { skipped: false };
}
