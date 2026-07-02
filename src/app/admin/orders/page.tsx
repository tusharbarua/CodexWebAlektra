import { OrderStatus, PaymentStatus, Prisma } from "@prisma/client";
import Link from "next/link";
import { BarChart3, CalendarDays, CircleDollarSign, PackageCheck, PackageOpen, Send, Truck } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { money } from "@/lib/format";
import { addOrderInternalNote, resendOrderNotifications, updateOrderPaymentStatus, updateOrderStatus } from "@/app/admin/actions";

export const dynamic = "force-dynamic";

type SearchParams = {
  tab?: string;
  date?: string;
  week?: string;
  month?: string;
  year?: string;
  q?: string;
  status?: string;
  paymentStatus?: string;
  deliveryMethod?: string;
  minTotal?: string;
  maxTotal?: string;
  page?: string;
  view?: string;
};

const periodTabs = ["daily", "weekly", "monthly", "yearly", "all"] as const;
const pipelineStatuses: OrderStatus[] = [
  OrderStatus.CONFIRMED,
  OrderStatus.BOOKED_FOR_SHIPPING,
  OrderStatus.HANDED_TO_COURIER,
  OrderStatus.PRODUCT_RECEIVED,
  OrderStatus.PAYMENT_CLEARED
];
const ongoingStatuses = [OrderStatus.NEW, OrderStatus.CONFIRMED, OrderStatus.PROCESSING, OrderStatus.BOOKED_FOR_SHIPPING, OrderStatus.HANDED_TO_COURIER, OrderStatus.SHIPPED, OrderStatus.READY_FOR_PICKUP];
const deliveredStatuses = [OrderStatus.PRODUCT_RECEIVED, OrderStatus.PAYMENT_CLEARED, OrderStatus.DELIVERED, OrderStatus.COMPLETED];
const pendingPaymentStatuses = [PaymentStatus.UNPAID, PaymentStatus.CASH_ON_DELIVERY, PaymentStatus.PENDING, PaymentStatus.INITIATED];
const clearedPaymentStatuses = [PaymentStatus.PAID, PaymentStatus.PAYMENT_CLEARED];
const pendingOrderStatuses: OrderStatus[] = [OrderStatus.NEW, OrderStatus.CONFIRMED, OrderStatus.PENDING];

export default async function AdminOrdersPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const tab = periodTabs.includes(params.tab as (typeof periodTabs)[number]) ? params.tab as (typeof periodTabs)[number] : "daily";
  const now = new Date();
  const selectedPeriod = getSelectedPeriod(tab, params, now);
  const monthPeriod = getMonthPeriod(now.getFullYear(), now.getMonth());
  const yearPeriod = getYearPeriod(now.getFullYear());
  const page = Math.max(Number(params.page ?? 1), 1);
  const pageSize = 20;
  const where = orderWhere(params, selectedPeriod);
  const pipelineWhere: Prisma.OrderWhereInput = { ...where, status: { in: pipelineStatuses } };

  const [orders, orderCount, current, globalMonth, globalYear, selectedSummary, pipelineOrders, monthlyTrend] = await Promise.all([
    prisma.order.findMany({
      where,
      include: { items: true },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize
    }).catch(() => []),
    prisma.order.count({ where }).catch(() => 0),
    params.view ? prisma.order.findUnique({
      where: { id: params.view },
      include: {
        items: true,
        notifications: { orderBy: { createdAt: "desc" } },
        statusHistory: { include: { changedBy: true }, orderBy: { createdAt: "asc" } }
      }
    }) : null,
    summarizeOrders({ createdAt: { gte: monthPeriod.start, lt: monthPeriod.end } }),
    summarizeOrders({ createdAt: { gte: yearPeriod.start, lt: yearPeriod.end } }),
    summarizeOrders(where),
    prisma.order.findMany({ where: pipelineWhere, include: { items: true }, orderBy: { createdAt: "asc" }, take: 80 }).catch(() => []),
    monthWiseTrend(now.getFullYear())
  ]);

  const totalPages = Math.max(Math.ceil(orderCount / pageSize), 1);

  return (
    <div className="admin-orders-page">
      <div className="admin-page-heading">
        <div>
          <p className="kicker">Ecommerce</p>
          <h1>Order Control Center</h1>
          <p>Track sales, fulfillment, payments and customer notifications from one workspace.</p>
        </div>
        <Link className="btn secondary compact" href={`/api/admin/orders/export${querySuffix(params)}`}>Export CSV</Link>
      </div>

      <section className="order-metric-grid">
        <Metric tone="blue" icon={<CalendarDays size={18} />} label="Number of Orders This Month" value={globalMonth.totalOrders.toLocaleString("en-BD")} note={`${globalMonth.deliveredOrders} delivered`} />
        <Metric tone="emerald" icon={<CircleDollarSign size={18} />} label="Order Value This Month" value={money(globalMonth.totalOrderValue)} note={`Average ${money(globalMonth.averageOrderValue)}`} />
        <Metric tone="violet" icon={<BarChart3 size={18} />} label="Total Number of Orders This Year" value={globalYear.totalOrders.toLocaleString("en-BD")} note={`${globalYear.cancelledOrders} cancelled`} />
        <Metric tone="amber" icon={<CircleDollarSign size={18} />} label="Total Order Value This Year" value={money(globalYear.totalOrderValue)} note={`${money(globalYear.paidOrderValue)} cleared`} />
        <Metric tone="orange" icon={<PackageOpen size={18} />} label="Pending / Confirmed Orders" value={selectedSummary.pendingOrders.toLocaleString("en-BD")} note="Selected period" />
        <Metric tone="sky" icon={<Truck size={18} />} label="Orders Awaiting Shipping" value={selectedSummary.awaitingShipping.toLocaleString("en-BD")} note="Selected period" />
        <Metric tone="green" icon={<PackageCheck size={18} />} label="Payment Cleared Amount" value={money(selectedSummary.paidOrderValue)} note={`${money(selectedSummary.pendingPaymentValue)} pending`} />
        <Metric tone="slate" icon={<BarChart3 size={18} />} label="Average Order Value" value={money(selectedSummary.averageOrderValue)} note={periodLabel(selectedPeriod, tab)} />
      </section>

      <section className="admin-card order-tabs-card">
        <div className="order-period-tabs">
          {periodTabs.map((period) => <Link className={tab === period ? "active" : ""} href={withParams(params, { tab: period, page: "1" })} key={period}>{period === "all" ? "All Orders" : title(period)}</Link>)}
        </div>
        <form className="order-filter-grid">
          <input type="hidden" name="tab" value={tab} />
          {tab === "daily" ? <Field name="date" label="Date" type="date" value={params.date ?? isoDate(now)} /> : null}
          {tab === "weekly" ? <Field name="week" label="Week" type="week" value={params.week ?? isoWeekInput(now)} /> : null}
          {tab === "monthly" ? <Field name="month" label="Month" type="month" value={params.month ?? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`} /> : null}
          {tab === "yearly" ? <Field name="year" label="Year" type="number" value={params.year ?? String(now.getFullYear())} /> : null}
          <Field name="q" label="Search" placeholder="Order, mobile or customer" value={params.q ?? ""} />
          <label className="field"><span>Status</span><select name="status" defaultValue={params.status ?? ""}><option value="">All statuses</option>{Object.values(OrderStatus).map((status) => <option value={status} key={status}>{statusLabel(status)}</option>)}</select></label>
          <label className="field"><span>Payment</span><select name="paymentStatus" defaultValue={params.paymentStatus ?? ""}><option value="">All payments</option>{Object.values(PaymentStatus).map((status) => <option value={status} key={status}>{paymentLabel(status)}</option>)}</select></label>
          <label className="field"><span>Delivery</span><select name="deliveryMethod" defaultValue={params.deliveryMethod ?? ""}><option value="">All delivery</option><option value="COURIER">Courier</option><option value="PICKUP">Pickup</option></select></label>
          <Field name="minTotal" label="Min value" type="number" value={params.minTotal ?? ""} />
          <Field name="maxTotal" label="Max value" type="number" value={params.maxTotal ?? ""} />
          <button className="btn compact">Apply filters</button>
        </form>
      </section>

      <section className="admin-card order-trend-card">
        <div className="admin-section-heading">
          <h2>{now.getFullYear()} Month-wise Sales Trend</h2>
          <p>Future-ready reporting foundation for monthly sales and average order value.</p>
        </div>
        <div className="trend-grid">{monthlyTrend.map((row) => <div className="trend-row" key={row.month}><span>{row.month}</span><strong>{row.orders}</strong><em>{money(row.value)}</em></div>)}</div>
      </section>

      <section className="admin-card order-pipeline-card">
        <div className="admin-section-heading">
          <h2>Ongoing Order Pipeline</h2>
          <p>{periodLabel(selectedPeriod, tab)} · showing active fulfillment stages.</p>
        </div>
        <div className="order-pipeline-grid">
          {pipelineStatuses.map((status) => {
            const rows = pipelineOrders.filter((order) => order.status === status);
            return <div className="pipeline-column" key={status}><h3>{statusLabel(status)} <span>{rows.length}</span></h3>
              {rows.map((order) => <article className="pipeline-order-card" key={order.id}>
                <Link href={withParams(params, { view: order.id })}>{order.orderNumber}</Link>
                <p>{order.customerName}<br/><small>{order.customerPhone}</small></p>
                <strong>{money(Number(order.totalBdt))}</strong>
                <span>{order.deliveryMethod} · {age(order.createdAt)}</span>
                <NextStatusForm orderId={order.id} status={order.status} />
              </article>)}
              {!rows.length ? <p className="pipeline-empty">No orders</p> : null}
            </div>;
          })}
        </div>
      </section>

      {current ? <OrderDetail current={current} params={params} /> : null}

      <section className="admin-table-wrap order-table-card">
        <table className="table order-table">
          <thead><tr><th>Order number</th><th>Date</th><th>Customer</th><th>Items</th><th>Order value</th><th>Delivery</th><th>Order status</th><th>Payment</th><th>Notification</th><th>Actions</th></tr></thead>
          <tbody>{orders.map((order) => (
            <tr key={order.id}>
              <td><strong>{order.orderNumber}</strong></td>
              <td>{order.createdAt.toLocaleDateString("en-GB")}<br/><small>{order.createdAt.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}</small></td>
              <td>{order.customerName}<br/><small>{order.customerPhone}</small></td>
              <td>{order.items.reduce((sum, item) => sum + item.quantity, 0)}</td>
              <td>{money(Number(order.totalBdt))}</td>
              <td>{order.deliveryMethod}<br/><small>{order.deliveryLabel}</small></td>
              <td><StatusBadge status={order.status} /></td>
              <td><PaymentBadge status={order.paymentStatus} /></td>
              <td><small>SMS: {order.smsStatus}</small><br/><small>Email: {order.emailStatus}</small></td>
              <td className="table-actions">
                <Link className="btn secondary compact" href={withParams(params, { view: order.id })}>View</Link>
                <a className="btn secondary compact" href={`/api/admin/orders/${order.id}/invoice`} target="_blank">Invoice</a>
              </td>
            </tr>
          ))}</tbody>
        </table>
        {!orders.length ? <p className="admin-empty-state">No orders found for this period or filter.</p> : null}
      </section>
      <div className="admin-pagination">
        <Link className={`btn secondary compact ${page <= 1 ? "disabled" : ""}`} href={withParams(params, { page: String(Math.max(page - 1, 1)) })}>Previous</Link>
        <span>Page {page} of {totalPages}</span>
        <Link className={`btn secondary compact ${page >= totalPages ? "disabled" : ""}`} href={withParams(params, { page: String(Math.min(page + 1, totalPages)) })}>Next</Link>
      </div>
    </div>
  );
}

function OrderDetail({ current, params }: { current: Prisma.OrderGetPayload<{ include: { items: true; notifications: true; statusHistory: { include: { changedBy: true } } } }>; params: SearchParams }) {
  return <section className="admin-card admin-order-detail">
    <div className="toolbar"><div><h2>{current.orderNumber}</h2><p>{current.customerName} · {current.customerPhone} · {money(Number(current.totalBdt))}</p></div><Link className="btn secondary compact" href={withParams({ ...params, view: undefined }, {})}>Close</Link></div>
    <div className="admin-two-column order-detail-grid">
      <div>
        <h3>Customer and delivery</h3>
        <p><strong>Verified mobile:</strong> {current.verifiedMobile ?? current.customerPhone}<br/><strong>Email:</strong> {current.customerEmail ?? "Not provided"}<br/><strong>Company:</strong> {current.companyName ?? "Not provided"}<br/><strong>Delivery:</strong> {current.deliveryLabel ?? current.deliveryMethod}<br/><strong>OTP:</strong> {current.verifiedMobile ? "Verified" : "Not verified"}<br/><strong>Notes:</strong> {current.deliveryNotes ?? "None"}</p>
        <OrderAddress address={current.shippingAddress} />
        <h3>Items</h3>
        <table className="table compact-table"><tbody>{current.items.map((item) => <tr key={item.id}><td>{item.name}<br/><small>{item.sku}</small></td><td>{item.quantity}</td><td>{money(Number(item.lineTotalBdt))}</td></tr>)}</tbody></table>
      </div>
      <div>
        <div className="order-status-row"><StatusBadge status={current.status} /><PaymentBadge status={current.paymentStatus} /></div>
        <form action={updateOrderStatus} className="admin-form">
          <input type="hidden" name="id" value={current.id} />
          <label className="field"><span>Update order status</span><select name="status" defaultValue={current.status}>{Object.values(OrderStatus).map((status) => <option value={status} key={status}>{statusLabel(status)}</option>)}</select></label>
          <label className="field"><span>Internal note</span><textarea name="note" rows={3} placeholder="Optional note for timeline" /></label>
          <button className="btn compact">Update status</button>
        </form>
        <form action={updateOrderPaymentStatus} className="admin-form">
          <input type="hidden" name="id" value={current.id} />
          <label className="field"><span>Update payment status</span><select name="paymentStatus" defaultValue={current.paymentStatus}>{Object.values(PaymentStatus).map((status) => <option value={status} key={status}>{paymentLabel(status)}</option>)}</select></label>
          <label className="field"><span>Payment note</span><textarea name="note" rows={3} placeholder="Optional payment note" /></label>
          <button className="btn compact">Update payment</button>
        </form>
        <form action={addOrderInternalNote} className="admin-form">
          <input type="hidden" name="id" value={current.id} />
          <label className="field"><span>Add internal note</span><textarea name="note" rows={3} required /></label>
          <button className="btn secondary compact">Add note</button>
        </form>
        <div className="admin-form-actions">
          <a className="btn secondary compact" href={`/api/admin/orders/${current.id}/invoice`} target="_blank">Print invoice</a>
          <form action={resendOrderNotifications}><input type="hidden" name="id" value={current.id} /><button className="btn secondary compact" type="submit"><Send size={14}/> Resend SMS/email</button></form>
        </div>
      </div>
    </div>
    <div className="order-detail-grid">
      <div>
        <h3>Status timeline</h3>
        <div className="order-timeline">
          {current.statusHistory.length ? current.statusHistory.map((entry) => <div key={entry.id}><span>{entry.createdAt.toLocaleString("en-GB")}</span><strong>{statusLabel(entry.fromStatus)} → {statusLabel(entry.toStatus)}</strong><p>{entry.note || "Status updated"}<br/><small>{entry.changedBy?.name ?? entry.changedBy?.email ?? "System"} {entry.paymentStatus ? `· ${paymentLabel(entry.paymentStatus)}` : ""}</small></p></div>) : <p>No status updates yet.</p>}
        </div>
      </div>
      <div>
        <h3>Notifications</h3>
        <p>Confirmation SMS: {current.smsStatus}<br/>Confirmation email: {current.emailStatus}</p>
        {current.notifications.map((notification) => <p className="notification-log-row" key={notification.id}><strong>{notification.channel}</strong> {notification.status} to {notification.recipient}<br/><small>{notification.message}</small></p>)}
      </div>
    </div>
    {current.notes ? <div><h3>Internal notes</h3><pre className="admin-json-box">{current.notes}</pre></div> : null}
  </section>;
}

function OrderAddress({ address }: { address: Prisma.JsonValue }) {
  const data = jsonRecord(address);
  if (data.pickupAddress) {
    return <div className="admin-address-box"><strong>Pickup location</strong><p>{display(data.pickupAddress)}</p></div>;
  }
  const rows = [
    ["Division", display(data.divisionName), display(data.divisionId)],
    ["District", display(data.districtName ?? data.district), display(data.districtId)],
    ["Upazila / Thana", display(data.upazilaName ?? data.city ?? data.thanaName), display(data.upazilaId)],
    ["Post office", display(data.postOffice), ""],
    ["Postal code", display(data.postalCode), ""],
    ["Address line", display(data.addressLine ?? data.line1), ""],
    ["Delivery notes", display(data.deliveryNotes), ""],
    ["Address source", data.manualAddressFallback ? "Manual fallback" : display(data.locationSource) || "bangladesh-geojson", ""]
  ].filter((row) => row[1] && row[1] !== "Not provided");

  return (
    <div className="admin-address-box">
      <strong>Shipping address</strong>
      <dl>
        {rows.map(([label, value, meta]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}{meta ? <small>ID: {meta}</small> : null}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function jsonRecord(value: Prisma.JsonValue): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function display(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : "";
}

function Metric({ tone, icon, label, value, note }: { tone: string; icon: React.ReactNode; label: string; value: string; note: string }) {
  return <article className={`order-metric-card tone-${tone}`}><span>{icon}</span><div><p>{label}</p><strong>{value}</strong><small>{note}</small></div></article>;
}

function NextStatusForm({ orderId, status }: { orderId: string; status: OrderStatus }) {
  const next = nextPipelineStatus(status);
  if (!next) return null;
  return <form action={updateOrderStatus}><input type="hidden" name="id" value={orderId} /><input type="hidden" name="status" value={next} /><input type="hidden" name="note" value={`Moved to ${statusLabel(next)} from pipeline`} /><button className="btn secondary compact">Next: {statusLabel(next)}</button></form>;
}

function StatusBadge({ status }: { status: OrderStatus }) {
  return <span className={`order-badge status-${status.toLowerCase().replaceAll("_", "-")}`}>{statusLabel(status)}</span>;
}

function PaymentBadge({ status }: { status: PaymentStatus }) {
  return <span className={`order-badge payment-${status.toLowerCase().replaceAll("_", "-")}`}>{paymentLabel(status)}</span>;
}

function Field({ name, label, type = "text", value = "", placeholder = "" }: { name: string; label: string; type?: string; value?: string; placeholder?: string }) {
  return <label className="field"><span>{label}</span><input name={name} type={type} defaultValue={value} placeholder={placeholder} /></label>;
}

function orderWhere(params: SearchParams, period: { start?: Date; end?: Date }) {
  const where: Prisma.OrderWhereInput = {};
  if (period.start && period.end) where.createdAt = { gte: period.start, lt: period.end };
  if (params.status) where.status = params.status as OrderStatus;
  if (params.paymentStatus) where.paymentStatus = params.paymentStatus as PaymentStatus;
  if (params.deliveryMethod) where.deliveryMethod = params.deliveryMethod;
  if (params.minTotal || params.maxTotal) where.totalBdt = { ...(params.minTotal ? { gte: Number(params.minTotal) } : {}), ...(params.maxTotal ? { lte: Number(params.maxTotal) } : {}) };
  if (params.q) where.OR = [{ orderNumber: { contains: params.q } }, { customerPhone: { contains: params.q } }, { customerName: { contains: params.q } }];
  return where;
}

async function summarizeOrders(where: Prisma.OrderWhereInput) {
  const [rows, deliveredOrders, cancelledOrders, pendingPayment, paidPayment, awaitingShipping] = await Promise.all([
    prisma.order.findMany({ where, select: { totalBdt: true, paymentStatus: true, status: true } }).catch(() => []),
    prisma.order.count({ where: { ...where, status: { in: deliveredStatuses } } }).catch(() => 0),
    prisma.order.count({ where: { ...where, status: OrderStatus.CANCELLED } }).catch(() => 0),
    prisma.order.findMany({ where: { ...where, paymentStatus: { in: pendingPaymentStatuses } }, select: { totalBdt: true } }).catch(() => []),
    prisma.order.findMany({ where: { ...where, paymentStatus: { in: clearedPaymentStatuses } }, select: { totalBdt: true } }).catch(() => []),
    prisma.order.count({ where: { ...where, status: { in: ongoingStatuses } } }).catch(() => 0)
  ]);
  const totalOrderValue = sumMoney(rows);
  const totalOrders = rows.length;
  return {
    totalOrders,
    totalOrderValue,
    paidOrderValue: sumMoney(paidPayment),
    pendingPaymentValue: sumMoney(pendingPayment),
    deliveredOrders,
    cancelledOrders,
    averageOrderValue: totalOrders ? totalOrderValue / totalOrders : 0,
    pendingOrders: rows.filter((row) => pendingOrderStatuses.includes(row.status)).length,
    awaitingShipping
  };
}

async function monthWiseTrend(year: number) {
  const rows = await prisma.order.findMany({
    where: { createdAt: { gte: new Date(year, 0, 1), lt: new Date(year + 1, 0, 1) } },
    select: { createdAt: true, totalBdt: true }
  }).catch(() => []);
  return Array.from({ length: 12 }, (_, index) => {
    const monthRows = rows.filter((row) => row.createdAt.getMonth() === index);
    return { month: new Date(year, index, 1).toLocaleString("en", { month: "short" }), orders: monthRows.length, value: sumMoney(monthRows) };
  });
}

function sumMoney(rows: { totalBdt: Prisma.Decimal | number }[]) {
  return rows.reduce((sum, row) => sum + Number(row.totalBdt), 0);
}

function getSelectedPeriod(tab: string, params: SearchParams, now: Date) {
  if (tab === "all") return {};
  if (tab === "weekly") return parseWeek(params.week) ?? weekPeriod(now);
  if (tab === "monthly") {
    const [year, month] = (params.month ?? "").split("-").map(Number);
    return year && month ? getMonthPeriod(year, month - 1) : getMonthPeriod(now.getFullYear(), now.getMonth());
  }
  if (tab === "yearly") return getYearPeriod(Number(params.year) || now.getFullYear());
  const day = params.date ? new Date(`${params.date}T00:00:00`) : new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return { start: day, end: new Date(day.getFullYear(), day.getMonth(), day.getDate() + 1) };
}

function getMonthPeriod(year: number, monthIndex: number) {
  return { start: new Date(year, monthIndex, 1), end: new Date(year, monthIndex + 1, 1) };
}

function getYearPeriod(year: number) {
  return { start: new Date(year, 0, 1), end: new Date(year + 1, 0, 1) };
}

function weekPeriod(date: Date) {
  const day = date.getDay() || 7;
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate() - day + 1);
  return { start, end: new Date(start.getFullYear(), start.getMonth(), start.getDate() + 7) };
}

function parseWeek(input?: string) {
  const match = input?.match(/^(\d{4})-W(\d{2})$/);
  if (!match) return null;
  const year = Number(match[1]);
  const week = Number(match[2]);
  const jan4 = new Date(year, 0, 4);
  const first = weekPeriod(jan4).start;
  const start = new Date(first.getFullYear(), first.getMonth(), first.getDate() + (week - 1) * 7);
  return { start, end: new Date(start.getFullYear(), start.getMonth(), start.getDate() + 7) };
}

function isoDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function isoWeekInput(date: Date) {
  const target = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = target.getUTCDay() || 7;
  target.setUTCDate(target.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((target.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${target.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

function withParams(params: SearchParams, updates: Record<string, string | undefined>) {
  const next = new URLSearchParams();
  Object.entries({ ...params, ...updates }).forEach(([key, value]) => {
    if (value) next.set(key, value);
  });
  return `/admin/orders${next.size ? `?${next.toString()}` : ""}`;
}

function querySuffix(params: SearchParams) {
  const next = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value && key !== "view") next.set(key, value);
  });
  return next.size ? `?${next.toString()}` : "";
}

function periodLabel(period: { start?: Date; end?: Date }, tab: string) {
  if (!period.start || !period.end) return "All orders";
  return `${title(tab)} · ${period.start.toLocaleDateString("en-GB")} - ${new Date(period.end.getTime() - 1).toLocaleDateString("en-GB")}`;
}

function statusLabel(status?: OrderStatus | null) {
  if (!status) return "Created";
  return status.toLowerCase().split("_").map(title).join(" ");
}

function paymentLabel(status: PaymentStatus) {
  return status.toLowerCase().split("_").map(title).join(" ");
}

function title(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function age(date: Date) {
  const hours = Math.max(Math.round((Date.now() - date.getTime()) / 36e5), 0);
  if (hours < 24) return `${hours}h old`;
  return `${Math.floor(hours / 24)}d old`;
}

function nextPipelineStatus(status: OrderStatus) {
  const index = pipelineStatuses.indexOf(status);
  return index >= 0 && index < pipelineStatuses.length - 1 ? pipelineStatuses[index + 1] : null;
}
