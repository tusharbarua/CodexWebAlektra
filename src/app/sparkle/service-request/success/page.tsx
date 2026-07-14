import Link from "next/link";
import { CheckCircle2, Download } from "lucide-react";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function SparkleRequestSuccess({ searchParams }: { searchParams: Promise<{ request?: string }> }) {
  const { request } = await searchParams;
  const row = request ? await prisma.sparkleServiceRequest.findUnique({ where: { requestNumber: request } }) : null;
  return (
    <main className="sparkle-page sparkle-success-page">
      <section className="sparkle-section">
        <div className="container">
          <div className="sparkle-success-card sparkle-glass">
            <CheckCircle2 size={42} />
            <p className="sparkle-kicker">Service request received</p>
            <h1>Thank you for choosing Alektra Sparkle.</h1>
            {row ? (
              <div className="sparkle-success-summary">
                <strong>{row.requestNumber}</strong>
                <span>{String(row.pvCapacityKwp)} kWp PV capacity</span>
                <span>{row.institutionName}</span>
                <span>Status: {row.status.replaceAll("_", " ")}</span>
              </div>
            ) : <p>Your request has been received. Our team will contact you shortly.</p>}
            <p>Our team will review the rooftop cleaning requirement and contact you with the next steps.</p>
            <div className="sparkle-actions">
              {row ? <a className="sparkle-secondary-button" href={`/api/sparkle-requests/${row.requestNumber}/pdf`}><Download size={18} /> Download PDF</a> : null}
              <Link className="sparkle-primary-button" href="/sparkle">Back to Alektra Sparkle</Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
