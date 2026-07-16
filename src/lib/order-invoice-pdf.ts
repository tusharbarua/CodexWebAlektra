import { readFile } from "node:fs/promises";
import path from "node:path";
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage, type RGB } from "pdf-lib";
import type { Order, OrderItem } from "@prisma/client";

type InvoiceOrder = Order & { items: OrderItem[] };
type Field = { label: string; value?: string | null; stacked?: boolean };

const pageWidth = 595;
const pageHeight = 842;
const marginX = 42;
const footerY = 38;
const epc = {
  brandName: "Alektra Renewable",
  title: "ORDER CONFIRMATION INVOICE",
  logoPath: "/brand/alektra-renewable-logo.png",
  header: rgb(0.02, 0.19, 0.11),
  accent: rgb(0, 0.44, 0.21),
  grass: rgb(0.32, 0.72, 0.28),
  soft: rgb(0.94, 1, 0.96),
  text: rgb(0.06, 0.16, 0.12),
  muted: rgb(0.35, 0.42, 0.38),
  amber: rgb(0.96, 0.62, 0.04)
};

export async function generateOrderInvoicePdf(order: InvoiceOrder) {
  const pdf = await PDFDocument.create();
  let page = pdf.addPage([pageWidth, pageHeight]);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const logo = await embedLogo(pdf, epc.logoPath);
  const pages: PDFPage[] = [page];
  let y = 792;

  const newPage = () => {
    page = pdf.addPage([pageWidth, pageHeight]);
    pages.push(page);
    drawMiniHeader(page, font, bold, order.orderNumber);
    y = 742;
    drawTableHeader();
  };

  const ensureSpace = (height: number) => {
    if (y < footerY + height) newPage();
  };

  const drawText = (text: string, x: number, width: number, size: number, weight: PDFFont, color: RGB, lineGap = 4) => {
    const lines = wrap(text, size, width);
    for (const line of lines) {
      ensureSpace(size + lineGap + 6);
      page.drawText(line, { x, y, size, font: weight, color });
      y -= size + lineGap;
    }
  };

  drawMainHeader(page, logo, font, bold, order);
  y = 672;

  drawSectionTitle("Order information", bold);
  drawFields([
    { label: "Order reference", value: order.orderNumber },
    { label: "Order date", value: formatDate(order.createdAt) },
    { label: "Order status", value: formatStatus(order.status) },
    { label: "Payment method", value: formatStatus(order.paymentMethod) },
    { label: "Payment status", value: formatStatus(order.paymentStatus) },
    { label: "Customer name", value: order.customerName },
    { label: "Company", value: order.companyName },
    { label: "Email", value: order.customerEmail },
    { label: "Phone", value: order.customerPhone },
    { label: "Delivery", value: order.deliveryLabel || order.deliveryMethod, stacked: true },
    { label: "Delivery address", value: formatAddress(order.shippingAddress), stacked: true },
    { label: "Customer notes", value: order.notes || order.deliveryNotes, stacked: true }
  ]);

  y -= 12;
  drawSectionTitle("Products", bold);
  drawTableHeader();
  for (let index = 0; index < order.items.length; index += 1) {
    drawItemRow(order.items[index], index + 1);
  }

  y -= 12;
  drawFinancialSummary(order, font, bold);
  drawAssistanceCard(font, bold, order.paymentStatus);

  for (const [index, itemPage] of pages.entries()) drawFooter(itemPage, font, bold, index + 1, pages.length);

  const bytes = await pdf.save();
  return { bytes };

  function drawSectionTitle(title: string, weight: PDFFont) {
    ensureSpace(34);
    page.drawText(title, { x: marginX, y, size: 15, font: weight, color: epc.accent });
    y -= 22;
  }

  function drawFields(fields: Field[]) {
    for (const field of fields) {
      if (!field.value) continue;
      ensureSpace(42);
      const stacked = field.stacked || field.label.length > 18 || String(field.value).length > 52;
      page.drawText(`${field.label}:`, { x: 52, y, size: 9.2, font: bold, color: epc.muted });
      if (stacked) {
        y -= 13;
        drawText(String(field.value), 62, 478, 9.7, font, epc.text);
      } else {
        drawText(String(field.value), 174, 368, 9.7, font, epc.text);
      }
      y -= 2;
    }
  }

  function drawTableHeader() {
    ensureSpace(34);
    page.drawRectangle({ x: marginX, y: y - 17, width: 511, height: 24, color: epc.soft, borderColor: epc.accent, borderWidth: 0.5 });
    const headers = [["SL", 50], ["Product", 82], ["SKU", 292], ["Qty", 380], ["Unit Price", 414], ["Line Total", 496]] as const;
    for (const [label, x] of headers) {
      page.drawText(label, { x, y: y - 8, size: 8.5, font: bold, color: epc.accent });
    }
    y -= 28;
  }

  function drawItemRow(item: OrderItem, serial: number) {
    const productLines = wrap(item.name, 8.8, 194);
    const skuLines = wrap(item.sku || "-", 8, 70);
    const rowHeight = Math.max(36, 15 + Math.max(productLines.length, skuLines.length) * 11);
    ensureSpace(rowHeight + 10);
    page.drawLine({ start: { x: marginX, y: y + 7 }, end: { x: 553, y: y + 7 }, thickness: 0.35, color: rgb(0.86, 0.9, 0.88) });
    page.drawText(String(serial), { x: 52, y, size: 8.5, font, color: epc.text });
    let rowY = y;
    for (const line of productLines) {
      page.drawText(line, { x: 82, y: rowY, size: 8.8, font: rowY === y ? bold : font, color: epc.text });
      rowY -= 11;
    }
    rowY = y;
    for (const line of skuLines) {
      page.drawText(line, { x: 292, y: rowY, size: 8, font, color: epc.muted });
      rowY -= 10;
    }
    page.drawText(String(item.quantity), { x: 382, y, size: 8.5, font, color: epc.text });
    page.drawText(formatMoney(Number(item.unitPriceBdt)), { x: 414, y, size: 8.2, font, color: epc.text });
    page.drawText(formatMoney(Number(item.lineTotalBdt)), { x: 496, y, size: 8.2, font: bold, color: epc.text });
    y -= rowHeight;
  }

  function drawFinancialSummary(summaryOrder: InvoiceOrder, regular: PDFFont, weight: PDFFont) {
    ensureSpace(136);
    const boxX = 342;
    const row = (label: string, value: number, strong = false) => {
      page.drawText(label, { x: boxX, y, size: strong ? 10.5 : 9.2, font: strong ? weight : regular, color: strong ? epc.accent : epc.muted });
      page.drawText(formatMoney(value), { x: 462, y, size: strong ? 10.5 : 9.2, font: strong ? weight : regular, color: strong ? epc.text : epc.text });
      y -= strong ? 18 : 15;
    };
    page.drawRectangle({ x: boxX - 16, y: y - 96, width: 227, height: 112, color: epc.soft, borderColor: rgb(0.82, 0.9, 0.84), borderWidth: 0.6 });
    row("Subtotal", Number(summaryOrder.subtotalBdt));
    if (Number(summaryOrder.discountBdt) > 0) row("Discount", -Number(summaryOrder.discountBdt));
    if (Number(summaryOrder.deliveryBdt) > 0) row("Delivery", Number(summaryOrder.deliveryBdt));
    y -= 4;
    page.drawLine({ start: { x: boxX, y: y + 8 }, end: { x: 535, y: y + 8 }, thickness: 0.6, color: epc.accent });
    row("Grand Total", Number(summaryOrder.totalBdt), true);
  }

  function drawAssistanceCard(regular: PDFFont, weight: PDFFont, paymentStatus: string) {
    ensureSpace(136);
    y -= 8;
    page.drawRectangle({ x: marginX, y: y - 96, width: 511, height: 112, color: epc.soft, borderColor: epc.accent, borderWidth: 0.7 });
    page.drawText("Customer assistance", { x: 58, y: y - 2, size: 12, font: weight, color: epc.accent });
    y -= 20;
    drawText("Thank you for choosing Alektra Renewable. Our team may contact you to confirm product specifications, stock availability, delivery arrangements, payment information or other details necessary to process your order. For any assistance regarding this order, please contact us at +880 1877 572 234.", 58, 478, 9, regular, epc.text);
    y -= 2;
    if (paymentStatus !== "PAID" && paymentStatus !== "PAYMENT_CLEARED") {
      drawText("This document confirms that your order has been received. It should not be treated as proof of payment unless the payment status above is shown as Paid.", 58, 478, 8.5, regular, epc.muted);
    }
  }
}

function drawMainHeader(page: PDFPage, logo: Awaited<ReturnType<typeof embedLogo>>, font: PDFFont, bold: PDFFont, order: InvoiceOrder) {
  page.drawRectangle({ x: 0, y: 712, width: pageWidth, height: 130, color: epc.header });
  page.drawRectangle({ x: 0, y: 712, width: 12, height: 130, color: epc.grass });
  page.drawRectangle({ x: 408, y: 712, width: 187, height: 130, color: epc.soft, opacity: 0.12 });
  if (logo) {
    const ratio = Math.min(210 / logo.image.width, 62 / logo.image.height);
    page.drawImage(logo.image, { x: marginX, y: 770, width: logo.image.width * ratio, height: logo.image.height * ratio });
  } else {
    page.drawText("ALEKTRA RENEWABLE", { x: marginX, y: 792, size: 20, font: bold, color: rgb(1, 1, 1) });
  }
  page.drawText(epc.title, { x: marginX, y: 738, size: 16, font: bold, color: rgb(1, 1, 1) });
  page.drawText(`Order: ${order.orderNumber}`, { x: 365, y: 792, size: 10.5, font: bold, color: rgb(1, 1, 1) });
  page.drawText(`Created: ${formatDate(order.createdAt)}`, { x: 365, y: 772, size: 9.2, font, color: rgb(0.92, 0.98, 0.94) });
}

function drawMiniHeader(page: PDFPage, font: PDFFont, bold: PDFFont, orderNumber: string) {
  page.drawRectangle({ x: 0, y: 766, width: pageWidth, height: 76, color: epc.header });
  page.drawRectangle({ x: 0, y: 766, width: 12, height: 76, color: epc.grass });
  page.drawText("Alektra Renewable", { x: marginX, y: 810, size: 15, font: bold, color: rgb(1, 1, 1) });
  page.drawText(`Order confirmation invoice - ${orderNumber}`, { x: marginX, y: 790, size: 9.5, font, color: rgb(0.92, 0.98, 0.94) });
}

function drawFooter(page: PDFPage, font: PDFFont, bold: PDFFont, pageNo: number, pageCount: number) {
  page.drawLine({ start: { x: marginX, y: 54 }, end: { x: 553, y: 54 }, thickness: 0.7, color: epc.accent });
  page.drawText("Alektra Renewable / Alektra EPC", { x: marginX, y: 36, size: 9.2, font: bold, color: epc.text });
  page.drawText("contact@alektraepc.com | +880 1735 954 844 | +880 1877 572 234 | Chattogram | Dhaka | Bangladesh | alektraepc.com", {
    x: marginX,
    y: 22,
    size: 7.4,
    font,
    color: epc.muted
  });
  page.drawText(`Page ${pageNo} of ${pageCount}`, { x: 505, y: 36, size: 8, font, color: epc.muted });
}

async function embedLogo(pdf: PDFDocument, logoPath: string) {
  try {
    const file = await readFile(path.join(process.cwd(), "public", logoPath.replace(/^\//, "")));
    if (logoPath.toLowerCase().endsWith(".png")) return { image: await pdf.embedPng(file) };
    if (logoPath.toLowerCase().match(/\.(jpg|jpeg)$/)) return { image: await pdf.embedJpg(file) };
  } catch {
    return null;
  }
  return null;
}

function formatMoney(value: number) {
  return `BDT ${new Intl.NumberFormat("en-BD", { maximumFractionDigits: 0 }).format(value)}`;
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Dhaka"
  }).format(date);
}

function formatStatus(value: string) {
  return value.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatAddress(value: unknown) {
  if (!value || typeof value !== "object") return null;
  const address = value as Record<string, unknown>;
  const parts = [
    address.addressLine || address.line1,
    address.upazilaName || address.city,
    address.districtName || address.district,
    address.divisionName,
    address.postOffice,
    address.postalCode,
    address.pickupAddress
  ]
    .map((item) => typeof item === "string" ? item.trim() : "")
    .filter(Boolean);
  return parts.join(", ") || null;
}

function wrap(text: string, size: number, width: number) {
  const max = Math.max(10, Math.floor(width / (size * 0.5)));
  const lines: string[] = [];
  for (const paragraph of String(text).replace(/\r/g, "").split("\n")) {
    const words = paragraph.trim().replace(/\s+/g, " ").split(" ").filter(Boolean);
    let line = "";
    for (const word of words) {
      if (word.length > max) {
        if (line) {
          lines.push(line);
          line = "";
        }
        for (let index = 0; index < word.length; index += max) {
          lines.push(word.slice(index, index + max));
        }
        continue;
      }
      const next = `${line} ${word}`.trim();
      if (next.length > max && line) {
        lines.push(line);
        line = word;
      } else {
        line = next;
      }
    }
    if (line) lines.push(line);
  }
  return lines.length ? lines : [""];
}
