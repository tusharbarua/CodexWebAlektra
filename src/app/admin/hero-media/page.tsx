import { PageKey } from "@prisma/client";
import { EpcHeroVideoManager, HeroMediaManager } from "@/components/EpcHeroVideoManager";
import { getEpcHeroMaxBytes, getEpcHeroPreview, getHeroPreview } from "@/lib/hero-media";
import { divisionHeroLabels, isDivisionHeroPageKey } from "@/lib/hero-upload-config";
import { uploadRules } from "@/lib/uploads";

export const dynamic = "force-dynamic";

const pageTabs = [
  { key: PageKey.epc, label: "EPC" },
  { key: PageKey.thermal, label: divisionHeroLabels.thermal },
  { key: PageKey.sparkle, label: divisionHeroLabels.sparkle },
  { key: PageKey.mapping, label: divisionHeroLabels.mapping }
];

export default async function AdminHeroMediaPage({ searchParams }: { searchParams: Promise<{ pageKey?: string }> }) {
  const { pageKey } = await searchParams;
  const division = isDivisionHeroPageKey(pageKey) ? pageKey : null;
  const activePageKey = division ?? PageKey.epc;
  const preview = division ? await getHeroPreview(division) : await getEpcHeroPreview();
  const maxBytes = getEpcHeroMaxBytes();

  return (
    <div>
      <p className="kicker">Hero Media</p>
      <h1>{division ? `${divisionHeroLabels[division]} hero media` : "Homepage hero video"}</h1>
      <HeroTabs active={activePageKey} />
      {division
        ? <HeroMediaManager key={division} pageKey={division} initial={preview} maxBytes={maxBytes} imageMaxBytes={uploadRules.adminImage.maxBytes} />
        : <EpcHeroVideoManager initial={preview} maxBytes={maxBytes} />}
    </div>
  );
}

function HeroTabs({ active }: { active: PageKey }) {
  return (
    <div className="order-period-tabs hero-media-tabs">
      {pageTabs.map((tab) => <a className={active === tab.key ? "active" : ""} href={`/admin/hero-media?pageKey=${tab.key}`} key={tab.key}>{tab.label}</a>)}
    </div>
  );
}
