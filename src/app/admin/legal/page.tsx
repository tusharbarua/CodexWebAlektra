import { PublishStatus } from "@prisma/client";
import { saveLegalDocument } from "@/app/admin/actions";
import { legalDefaults, type LegalDocumentKey } from "@/lib/legal-documents";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type LegalRow = {
  documentKey: string;
  title: string;
  slug: string;
  content: string;
  version: string;
  effectiveDate: Date | null;
  status: PublishStatus;
  updatedAt: Date;
  updatedBy: string | null;
};

export default async function AdminLegalPage({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  const params = await searchParams;
  const rows = await prisma.legalDocument.findMany({ orderBy: { documentKey: "asc" } }).catch(() => [] as LegalRow[]);
  const keys: LegalDocumentKey[] = ["privacy", "terms-of-use", "sales-and-refunds", "legal"];
  return (
    <div>
      <p className="kicker">Site Content</p>
      <h1>Global legal content.</h1>
      <p className="admin-muted">Edit the public footer legal documents used by the modal and standalone legal pages.</p>
      {params.saved ? <div className="admin-success">Legal document saved.</div> : null}
      <div className="admin-card-grid legal-admin-grid">
        {keys.map((key) => {
          const row = rows.find((item) => item.documentKey === key);
          return <LegalDocumentForm key={key} documentKey={key} row={row} />;
        })}
      </div>
    </div>
  );
}

function LegalDocumentForm({ documentKey, row }: { documentKey: LegalDocumentKey; row?: LegalRow }) {
  const fallback = legalDefaults[documentKey];
  return (
    <form action={saveLegalDocument} className="panel admin-form legal-admin-form">
      <input type="hidden" name="documentKey" value={documentKey} />
      <div>
        <h2>{fallback.title}</h2>
        {row ? <p className="admin-muted">Last updated {row.updatedAt.toLocaleString("en-GB")}{row.updatedBy ? ` by ${row.updatedBy}` : ""}</p> : <p className="admin-muted">Using seeded default until saved.</p>}
      </div>
      <label className="field"><span>Title</span><input name="title" defaultValue={row?.title ?? fallback.title} required /></label>
      <label className="field"><span>Slug</span><input name="slug" defaultValue={row?.slug ?? fallback.slug} required /></label>
      <label className="field"><span>Version</span><input name="version" defaultValue={row?.version ?? "v1.0"} required /></label>
      <label className="field"><span>Effective date</span><input name="effectiveDate" type="date" defaultValue={row?.effectiveDate ? row.effectiveDate.toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10)} /></label>
      <label className="field"><span>Status</span><select name="status" defaultValue={row?.status ?? PublishStatus.PUBLISHED}>{Object.values(PublishStatus).map((status) => <option value={status} key={status}>{status}</option>)}</select></label>
      <label className="field wide"><span>Content</span><textarea name="content" rows={20} defaultValue={row?.content ?? fallback.content} required /></label>
      <div className="admin-form-actions"><button className="btn compact">Save {fallback.title}</button></div>
    </form>
  );
}
