/* eslint-disable @next/next/no-img-element */

import { deleteHeroMedia, saveHeroMedia } from "@/app/admin/actions";
import { SingleFilePreview } from "@/components/SingleFilePreview";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminHeroMediaPage({ searchParams }: { searchParams: Promise<{ edit?: string; error?: string }> }) {
  const { edit, error } = await searchParams;
  const [items, current] = await Promise.all([
    prisma.heroMedia.findMany({ orderBy: [{ sortOrder: "asc" }, { updatedAt: "desc" }] }),
    edit ? prisma.heroMedia.findUnique({ where: { id: edit } }) : null
  ]);

  return (
    <div>
      <p className="kicker">Hero Media</p>
      <h1>{current ? "Edit hero media" : "Hero media library"}</h1>
      {error ? <div className="admin-error">{decodeURIComponent(error)}</div> : null}
      <form action={saveHeroMedia} className="panel admin-form">
        <input type="hidden" name="id" value={current?.id ?? ""} />
        <Field name="title" label="Title" value={current?.title} />
        <label className="field"><span>Media type</span><select name="mediaType" defaultValue={current?.mediaType ?? "image"}><option value="image">Image</option><option value="video">Video</option></select></label>
        <Field name="alt" label="Alt text" value={current?.alt} />
        <Field name="sortOrder" label="Sort order" type="number" value={current?.sortOrder ?? 0} />
        <Field name="url" label="Optional media URL" value={current?.url} optional />
        <label className="field"><span>Status</span><select name="status" defaultValue={current?.status ?? "DRAFT"}><option>DRAFT</option><option>PUBLISHED</option><option>UNPUBLISHED</option></select></label>
        <label className="check-field"><input type="checkbox" name="isPrimary" defaultChecked={current?.isPrimary} /> Primary media</label>
        <SingleFilePreview name="mediaFile" label="Upload image/video" accept="image/jpeg,image/png,image/webp,video/mp4,video/webm" existingUrl={current?.url} isVideo={current?.mediaType === "video"} />
        <div className="admin-form-actions"><button className="btn" type="submit">{current ? "Save media" : "Add media"}</button>{current ? <a className="btn secondary" href="/admin/hero-media">Cancel</a> : null}</div>
      </form>

      <div className="admin-card-grid">
        {items.map((item) => (
          <article className="admin-media-card" key={item.id}>
            <div className="admin-media-preview">
              {item.mediaType === "video" ? <video src={item.url} controls muted playsInline /> : <img src={item.url} alt={item.alt} />}
            </div>
            <div>
              <strong>{item.title}</strong>
              <p>{item.mediaType} | {item.status} | order {item.sortOrder}{item.isPrimary ? " | primary" : ""}</p>
            </div>
            <div className="table-actions">
              <a className="btn secondary compact" href={`/admin/hero-media?edit=${item.id}`}>Edit</a>
              <form action={deleteHeroMedia}><input type="hidden" name="id" value={item.id} /><button className="btn danger compact">Delete</button></form>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function Field({ name, label, value, type = "text", optional = false }: { name: string; label: string; value?: string | number | null; type?: string; optional?: boolean }) {
  return <label className="field"><span>{label}</span><input name={name} type={type} defaultValue={value ?? ""} required={!optional} /></label>;
}
