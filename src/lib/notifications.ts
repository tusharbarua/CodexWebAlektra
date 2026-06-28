import type { Order, OrderItem } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { money } from "@/lib/format";
import { sendOrderConfirmation } from "@/lib/mail";

export async function sendOrderNotifications(order: Order & { items?: OrderItem[] }) {
  const messaging = await prisma.messagingIntegration.findUnique({ where: { singletonKey: "default" } }).catch(() => null);
  const smsBody = (messaging?.orderConfirmationTemplate || "Your Alektra Renewable order #[ORDER_NUMBER] has been received. Total: BDT [TOTAL]. We will contact you shortly.")
    .replace("[ORDER_NUMBER]", order.orderNumber)
    .replace("[TOTAL]", Number(order.totalBdt).toLocaleString("en-BD"));

  let smsStatus = "NOT_CONFIGURED";
  if (messaging?.isEnabled && messaging.baseUrl && messaging.apiKey) {
    smsStatus = "PENDING_PROVIDER_ADAPTER";
  }
  await prisma.notificationLog.create({
    data: {
      orderId: order.id,
      channel: "SMS",
      recipient: order.customerPhone,
      status: smsStatus,
      message: smsBody,
      provider: messaging?.providerName ?? null,
      response: messaging?.isEnabled ? "Messaging provider adapter is ready for configuration." : "Messaging is not enabled."
    }
  });

  let emailStatus = "NOT_CONFIGURED";
  if (order.customerEmail) {
    try {
      const result = await sendOrderConfirmation(order);
      emailStatus = result.skipped ? "NOT_CONFIGURED" : "SENT";
    } catch (error) {
      emailStatus = "FAILED";
      await prisma.notificationLog.create({
        data: {
          orderId: order.id,
          channel: "EMAIL",
          recipient: order.customerEmail,
          status: "FAILED",
          message: `Order confirmation email for ${order.orderNumber}`,
          response: error instanceof Error ? error.message : "Email failed."
        }
      });
    }
  }

  await prisma.order.update({ where: { id: order.id }, data: { smsStatus, emailStatus } });
  return { smsStatus, emailStatus, smsBody };
}

export function orderEmailText(order: Order & { items?: OrderItem[] }) {
  const lines = order.items?.map((item) => `${item.name} x ${item.quantity} - ${money(Number(item.lineTotalBdt))}`).join("\n") ?? "";
  return `Order ${order.orderNumber}\nCustomer: ${order.customerName}\nMobile: ${order.customerPhone}\n\n${lines}\n\nSubtotal: ${money(Number(order.subtotalBdt))}\nDelivery: ${money(Number(order.deliveryBdt))}\nTotal: ${money(Number(order.totalBdt))}`;
}
