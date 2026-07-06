import Link from "next/link";
import { PolicyFormattedText } from "@/components/PolicyFormattedText";
import { getPublishedShopLegal } from "@/lib/shop-legal";

export const dynamic = "force-dynamic";

export default async function ShopTermsPage() {
  const policy = await getPublishedShopLegal("terms");
  return <ShopPolicy policy={policy} />;
}

function ShopPolicy({ policy }: { policy: Awaited<ReturnType<typeof getPublishedShopLegal>> }) {
  return (
    <main className="shop-page-shell">
      <div className="container shop-policy-page">
        <Link className="btn secondary compact" href="/shop">Back to Shop</Link>
        <article className="panel shop-policy-card">
          <p className="kicker">Shop Legal</p>
          <h1>{policy.title}</h1>
          <p className="admin-muted">Version {policy.version}{policy.effectiveDate ? ` · Effective ${policy.effectiveDate.toLocaleDateString("en-GB")}` : ""}</p>
          <div className="policy-text"><PolicyFormattedText content={policy.content} /></div>
        </article>
      </div>
    </main>
  );
}
