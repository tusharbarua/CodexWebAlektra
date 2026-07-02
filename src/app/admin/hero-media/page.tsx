/* eslint-disable @next/next/no-img-element */

import { PageKey } from "@prisma/client";
import { deleteHeroMedia, saveHeroMedia } from "@/app/admin/actions";
import { SingleFilePreview } from "@/components/SingleFilePreview";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const pageTabs: Array<{ key: PageKey; label: string; title: string; description: string }> = [
  { key: PageKey.epc, label: "EPC", title: "Alektra EPC / Homepage Hero Media", description: "Manage hero background image/video for the EPC homepage only." },
  { key: PageKey.thermal, label: "Thermal", title: "Alektra Thermal Hero Media", description: "Manage hero background image/video for the Alektra Thermal page only." },
  { key: PageKey.sparkle, label: "Sparkle", title: "Alektra Sparkle Hero Media", description: "Manage hero background image/video for the Alektra Sparkle page only." },
  { key: PageKey.mapping, label: "Mapping", title: "Alektra Mapping Hero Media", description: "Manage hero background image/video for the Alektra Mapping page only." }
];

export default async function AdminHeroMediaPage({ searchParams }: { searchParams: Promise<{ pageKey?: string; edit?: string; error?: string }> }) {
  const { edit, error, pageKey } = await searchParams;
  const selectedPageKey = pageTabs.some((tab) => tab.key === pageKey) ? pageKey as PageKey : PageKey.epc;
  const [items, current] = await Promise.all([
    prisma.heroMedia.findMany({ orderBy: [{ pageKey: "asc" }, { sortOrder: "asc" }, { updatedAt: "desc" }] }),
    edit ? prisma.heroMedia.findUnique({ where: { id: edit } }) : null
  ]);
  const activePageKey = current?.pageKey ?? selectedPageKey;
  const activeTab = pageTabs.find((tab) => tab.key === activePageKey) ?? pageTabs[0];
  const activeItems = items.filter((item) => item.pageKey === activePageKey);
  const primary = activeItems.find((item) => item.isPrimary && item.isPublished) ?? activeItems.find((item) => item.isPublished);

  return (
    <div>
      <p className="kicker">Hero Media</p>
      <h1>{current ? `Edit ${labelFor(current.pageKey)} hero media` : "Page-specific hero media"}</h1>
      <p className="admin-muted">Hero backgrounds are independent for EPC, Thermal, Sparkle and Mapping. Primary media is scoped to the selected page only.</p>
      {error ? <div className="admin-error">{decodeURIComponent(error)}</div> : null}

      <div className="order-period-tabs hero-media-tabs">
        {pageTabs.map((tab) => <a className={activePageKey === tab.key ? "active" : ""} href={`/admin/hero-media?pageKey=${tab.key}`} key={tab.key}>{tab.label}</a>)}
      </div>

      <section className="panel hero-media-page-panel">
        <div className="admin-section-heading">
          <div>
            <h2>{activeTab.title}</h2>
            <p>{activeTab.description}</p>
          </div>
          {primary ? <PreviewBadge item={primary} /> : <span className="status-pill muted">No published media</span>}
        </div>

        {primary ? (
          <div className="hero-primary-preview">
            <MediaPreview item={primary} />
            <div>
              <strong>Current primary media</strong>
              <p>{primary.title} · {primary.mediaType} · order {primary.sortOrder}</p>
            </div>
          </div>
        ) : null}

        <form action={saveHeroMedia} className="admin-form">
          <input type="hidden" name="id" value={current?.id ?? ""} />
          <input type="hidden" name="pageKey" value={activePageKey} />
          <Field name="title" label="Title" value={current?.title} />
          <label className="field"><span>Media type</span><select name="mediaType" defaultValue={current?.mediaType ?? "image"}><option value="image">Image</option><option value="video">Video</option></select></label>
          <Field name="altText" label="Alt text" value={current?.altText ?? current?.alt} />
          <Field name="sortOrder" label="Sort order" type="number" value={current?.sortOrder ?? 0} />
          <Field name="url" label="Optional media URL" value={current?.filePath ?? current?.url} optional />
          <label className="check-field"><input type="checkbox" name="isPrimary" defaultChecked={current?.isPrimary ?? !primary} /> Primary media for {labelFor(activePageKey)}</label>
          <label className="check-field"><input type="checkbox" name="isPublished" defaultChecked={current?.isPublished ?? true} /> Published</label>
          <SingleFilePreview name="mediaFile" label="Upload image/video" accept="image/jpeg,image/png,image/webp,video/mp4,video/webm" existingUrl={current?.filePath ?? current?.url} isVideo={current?.mediaType === "video"} />
          <SingleFilePreview name="posterFile" label="Optional poster image for video" accept="image/jpeg,image/png,image/webp" existingUrl={current?.posterImagePath} />
          <div className="admin-form-actions">
            <button className="btn" type="submit">{current ? "Save media" : `Add ${labelFor(activePageKey)} media`}</button>
            {current ? <a className="btn secondary" href={`/admin/hero-media?pageKey=${activePageKey}`}>Cancel</a> : null}
          </div>
        </form>
      </section>

      <div className="admin-card-grid hero-media-grid">
        {activeItems.map((item) => (
          <article className="admin-media-card" key={item.id}>
            <div className="admin-media-preview"><MediaPreview item={item} /></div>
            <div>
              <strong>{item.title}</strong>
              <p><span className="status-pill">{item.mediaType}</span> <span className={item.isPublished ? "status-pill success" : "status-pill muted"}>{item.isPublished ? "Published" : "Unpublished"}</span> {item.isPrimary ? <span className="status-pill accent">Primary</span> : null}</p>
              <p>Sort order {item.sortOrder}</p>
            </div>
            <div className="table-actions">
              <a className="btn secondary compact" href={`/admin/hero-media?pageKey=${item.pageKey}&edit=${item.id}`}>Edit</a>
              <form action={deleteHeroMedia}><input type="hidden" name="id" value={item.id} /><button className="btn danger compact">Delete</button></form>
            </div>
          </article>
        ))}
        {!activeItems.length ? <div className="admin-empty-state">No hero media uploaded for {labelFor(activePageKey)} yet.</div> : null}
      </div>
    </div>
  );
}

function Field({ name, label, value, type = "text", optional = false }: { name: string; label: string; value?: string | number | null; type?: string; optional?: boolean }) {
  return <label className="field"><span>{label}</span><input name={name} type={type} defaultValue={value ?? ""} required={!optional} /></label>;
}

function MediaPreview({ item }: { item: { mediaType: string; filePath: string | null; url: string; altText: string | null; alt: string; posterImagePath: string | null } }) {
  const src = item.filePath || item.url;
  if (item.mediaType === "video") return <video src={src} poster={item.posterImagePath ?? undefined} controls muted playsInline />;
  return <img src={src} alt={item.altText || item.alt} />;
}

function PreviewBadge({ item }: { item: { mediaType: string; isPrimary: boolean; isPublished: boolean } }) {
  return <span className="status-pill success">{item.isPrimary ? "Primary" : "Published"} {item.mediaType}</span>;
}

function labelFor(pageKey: PageKey) {
  if (pageKey === PageKey.epc) return "EPC";
  if (pageKey === PageKey.thermal) return "Thermal";
  if (pageKey === PageKey.sparkle) return "Sparkle";
  return "Mapping";
}
