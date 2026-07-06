import { CheckCircle2 } from "lucide-react";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function MappingRequestSuccess({ searchParams }: { searchParams: Promise<{ request?: string }> }) {
  const { request } = await searchParams;
  const row = request ? await prisma.mappingServiceRequest.findUnique({ where: { requestNumber: request } }) : null;
  return (
    <main className="mapping-page mapping-success-page">
      <section className="mapping-section">
        <div className="container">
          <div className="mapping-success-card mapping-glass">
            <CheckCircle2 size={42} />
            <p className="mapping-kicker">Request received</p>
            <h1>Thank you for requesting Alektra Mapping service.</h1>
            <p>Our team will review your mapping requirement and contact you shortly.</p>
            {row ? (
              <div className="mapping-success-summary">
                <strong>{row.requestNumber}</strong>
                <span>{row.serviceType}</span>
                <span>{row.projectSiteType}</span>
                <span>{row.institutionName}</span>
                <span>Status: {row.status.replaceAll("_", " ")}</span>
              </div>
            ) : null}
            <a className="mapping-primary-button" href="/mapping">Back to Alektra Mapping</a>
          </div>
        </div>
      </section>
    </main>
  );
}
