import { PublishStatus } from "@prisma/client";
import { saveShopLegalContent } from "@/app/admin/actions";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function ShopLegalAdminPage({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  const params = await searchParams;
  const rows = await prisma.shopLegalContent.findMany({ orderBy: { policyKey: "asc" } }).catch(() => []);
  const terms = rows.find((row) => row.policyKey === "terms");
  const refund = rows.find((row) => row.policyKey === "refund");
  return (
    <div>
      <p className="kicker">Ecommerce</p>
      <h1>Shop legal content.</h1>
      {params.saved ? <div className="admin-success">Legal content saved.</div> : null}
      <div className="admin-card-grid">
        <LegalForm policyKey="terms" title="Shop Terms & Conditions" row={terms} />
        <LegalForm policyKey="refund" title="Refund Policy" row={refund} />
      </div>
    </div>
  );
}

function LegalForm({ policyKey, title, row }: { policyKey: "terms" | "refund"; title: string; row?: { title: string; slug: string; content: string; version: string; effectiveDate: Date | null; status: PublishStatus } }) {
  return (
    <form action={saveShopLegalContent} className="panel admin-form">
      <input type="hidden" name="policyKey" value={policyKey} />
      <h2>{title}</h2>
      <label className="field"><span>Title</span><input name="title" defaultValue={row?.title ?? title} required /></label>
      <label className="field"><span>Slug</span><input name="slug" defaultValue={row?.slug ?? (policyKey === "terms" ? "shop-terms" : "shop-refund-policy")} required /></label>
      <label className="field"><span>Version</span><input name="version" defaultValue={row?.version ?? "v1.0"} required /></label>
      <label className="field"><span>Effective date</span><input name="effectiveDate" type="date" defaultValue={row?.effectiveDate ? row.effectiveDate.toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10)} /></label>
      <label className="field"><span>Status</span><select name="status" defaultValue={row?.status ?? PublishStatus.PUBLISHED}>{Object.values(PublishStatus).map((status) => <option value={status} key={status}>{status}</option>)}</select></label>
      <label className="field wide"><span>Content</span><textarea name="content" rows={22} defaultValue={row?.content ?? ""} required /></label>
      <div className="admin-form-actions"><button className="btn compact">Save {title}</button></div>
    </form>
  );
}
