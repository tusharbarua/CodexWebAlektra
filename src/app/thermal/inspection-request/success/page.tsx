import { notFound } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, CreditCard, Download } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { sslCommerzEnabled } from "@/lib/sslcommerz";

export const dynamic = "force-dynamic";

export default async function ThermalRequestSuccess({ searchParams }: { searchParams: Promise<{ request?: string }> }) {
  const { request: requestNumber } = await searchParams;
  if (!requestNumber) notFound();
  const request = await prisma.thermalInspectionRequest.findUnique({ where: { requestNumber } });
  if (!request) notFound();
  return <main className="thermal-page thermal-success"><div className="container thermal-success-card">
    <CheckCircle2 size={48}/><p className="thermal-kicker">Request received</p><h1>Thank you for choosing Alektra Thermal.</h1>
    <p>Our team will review your inspection request and contact you shortly.</p>
    <div className="thermal-summary"><strong>{request.requestNumber}</strong><span>{request.inspectionType === "STANDARD" ? "Standard" : "Comprehensive"} inspection</span><span>{String(request.pvCapacityKwp)} kWp PV capacity</span><span>{request.institutionName}</span><span>Status: {request.status.replaceAll("_", " ")}</span></div>
    <p>{request.emailSentAt ? "A PDF copy has been sent to your email." : "Your PDF confirmation is ready to download. Email delivery is not configured, but your request has been saved safely."}</p>
    <div className="thermal-actions"><a className="thermal-secondary-button" href={`/api/thermal-inspections/${request.requestNumber}/pdf`}><Download size={18}/> Download PDF</a>
      {request.askForPayment && request.calculatedFeeBdt && request.paymentStatus !== "PAID" ? <form action={`/api/thermal-inspections/${request.requestNumber}/pay`} method="post"><button className="thermal-primary-button" disabled={!sslCommerzEnabled()}><CreditCard size={18}/> Pay BDT {String(request.calculatedFeeBdt)}</button></form> : null}
      <Link className="thermal-secondary-button" href="/thermal">Back to Alektra Thermal</Link>
    </div>
    {request.askForPayment && request.calculatedFeeBdt && request.paymentStatus !== "PAID" && !sslCommerzEnabled()
      ? <p className="thermal-payment-note">Online payment is not configured yet. Your quotation remains active and the Alektra team will contact you with payment instructions.</p>
      : null}
  </div></main>;
}
