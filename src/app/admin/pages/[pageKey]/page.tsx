import { PageKey, PublishStatus } from "@prisma/client";
import Link from "next/link";
import { notFound } from "next/navigation";
import { deletePageSection, deletePageSectionItem, saveCmsPage, savePageSection, savePageSectionItem } from "@/app/admin/actions";
import { SingleFilePreview } from "@/components/SingleFilePreview";
import { getAdminPage } from "@/lib/page-cms";

export const dynamic = "force-dynamic";

const pageNames: Record<string, string> = {
  epc: "Alektra EPC",
  thermal: "Alektra Thermal",
  sparkle: "Alektra Sparkle",
  mapping: "Alektra Mapping"
};

export default async function AdminPageEditor({
  params,
  searchParams
}: {
  params: Promise<{ pageKey: string }>;
  searchParams: Promise<{ editSection?: string; editItem?: string; section?: string; error?: string; saved?: string }>;
}) {
  const { pageKey } = await params;
  if (!Object.values(PageKey).includes(pageKey as PageKey)) notFound();
  const query = await searchParams;
  const page = await getAdminPage(pageKey as PageKey);
  if (!page) notFound();
  const currentSection = query.editSection ? page.sections.find((section) => section.id === query.editSection) : null;
  const selectedSection = currentSection ?? page.sections.find((section) => section.id === query.section) ?? page.sections[0] ?? null;
  const currentItem = query.editItem ? page.sections.flatMap((section) => section.items).find((item) => item.id === query.editItem) : null;
  const currentSectionSettings = (currentSection?.settingsJson && typeof currentSection.settingsJson === "object" && !Array.isArray(currentSection.settingsJson)) ? currentSection.settingsJson as Record<string, unknown> : {};

  return (
    <div>
      <p className="kicker">CMS Pages</p>
      <h1>{pageNames[page.pageKey] ?? page.title}</h1>
      {query.error ? <div className="admin-error">{decodeURIComponent(query.error)}</div> : null}
      {query.saved ? <div className="form-message sent">Saved.</div> : null}

      <form action={saveCmsPage} className="panel admin-form">
        <input type="hidden" name="id" value={page.id} />
        <input type="hidden" name="pageKey" value={page.pageKey} />
        <Field name="title" label="Page title" value={page.title} />
        <Field name="slug" label="Slug" value={page.slug} />
        <Field name="metaTitle" label="Meta title" value={page.metaTitle} optional />
        <Field name="metaDescription" label="Meta description" value={page.metaDescription} optional />
        <label className="field"><span>Status</span><select name="status" defaultValue={page.status}>{Object.values(PublishStatus).map((status) => <option key={status}>{status}</option>)}</select></label>
        <div className="admin-form-actions"><button className="btn">Save page metadata</button><Link className="btn secondary" href={`/${page.slug}`} target="_blank">Preview page</Link></div>
      </form>

      <div className="admin-content-grid">
        <section className="panel">
          <h2>Sections</h2>
          <div className="admin-section-list">
            {page.sections.map((section) => (
              <div className="admin-list-row" key={section.id}>
                <div><strong>{section.title}</strong><span>{section.sectionKey} | {section.sectionType} | order {section.sortOrder} | {section.isPublished ? "Published" : "Hidden"}</span></div>
                <div className="table-actions">
                  <Link className="btn secondary compact" href={`/admin/pages/${page.pageKey}?editSection=${section.id}&section=${section.id}`}>Edit</Link>
                  <Link className="btn secondary compact" href={`/admin/pages/${page.pageKey}?section=${section.id}`}>Items</Link>
                  <form action={deletePageSection}><input type="hidden" name="id" value={section.id} /><input type="hidden" name="pageKey" value={page.pageKey} /><button className="btn danger compact">Delete</button></form>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <form action={savePageSection} className="panel admin-form">
            <h2>{currentSection ? "Edit section" : "Add section"}</h2>
            <input type="hidden" name="id" value={currentSection?.id ?? ""} />
            <input type="hidden" name="pageId" value={page.id} />
            <input type="hidden" name="pageKey" value={page.pageKey} />
            <Field name="sectionKey" label="Section key" value={currentSection?.sectionKey} />
            <Field name="sectionType" label="Section type" value={currentSection?.sectionType ?? "content"} />
            <Field name="title" label="Title" value={currentSection?.title} />
            <Field name="settingsKicker" label="Kicker" value={String(currentSectionSettings.kicker ?? "")} optional />
            <Field name="subtitle" label="Subtitle/kicker" value={currentSection?.subtitle} optional />
            <Area name="body" label="Body / Markdown" value={currentSection?.body} optional />
            <Field name="sortOrder" label="Sort order" type="number" value={currentSection?.sortOrder ?? 0} />
            <Area name="settingsJson" label="Settings JSON" value={pretty(currentSection?.settingsJson)} optional rows={6} />
            <label className="check-field"><input type="checkbox" name="isPublished" defaultChecked={currentSection?.isPublished ?? true} /> Published</label>
            <div className="admin-form-actions"><button className="btn">{currentSection ? "Save section" : "Add section"}</button>{currentSection ? <Link className="btn secondary" href={`/admin/pages/${page.pageKey}`}>Cancel</Link> : null}</div>
          </form>
        </section>
      </div>

      {selectedSection ? (
        <div className="admin-content-grid">
          <section className="panel">
            <h2>Items in {selectedSection.title}</h2>
            <div className="admin-section-list">
              {selectedSection.items.map((item) => (
                <div className="admin-list-row" key={item.id}>
                  <div><strong>{item.title}</strong><span>{item.badge ? `${item.badge} | ` : ""}order {item.sortOrder} | {item.isPublished ? "Published" : "Hidden"}</span></div>
                  <div className="table-actions">
                    <Link className="btn secondary compact" href={`/admin/pages/${page.pageKey}?section=${selectedSection.id}&editItem=${item.id}`}>Edit</Link>
                    <form action={deletePageSectionItem}><input type="hidden" name="id" value={item.id} /><input type="hidden" name="pageKey" value={page.pageKey} /><button className="btn danger compact">Delete</button></form>
                  </div>
                </div>
              ))}
              {!selectedSection.items.length ? <p>No items yet.</p> : null}
            </div>
          </section>

          <form action={savePageSectionItem} className="panel admin-form">
            <h2>{currentItem ? "Edit item" : "Add item"}</h2>
            <input type="hidden" name="id" value={currentItem?.id ?? ""} />
            <input type="hidden" name="sectionId" value={currentItem?.sectionId ?? selectedSection.id} />
            <input type="hidden" name="pageKey" value={page.pageKey} />
            <Field name="title" label="Title / question / card name" value={currentItem?.title} />
            <Field name="subtitle" label="Subtitle" value={currentItem?.subtitle} optional />
            <Area name="body" label="Body / Markdown / bullet list" value={currentItem?.body} optional rows={7} />
            <Field name="icon" label="Icon key" value={currentItem?.icon} optional />
            <Field name="badge" label="Badge / severity" value={currentItem?.badge} optional />
            <Field name="linkText" label="Link text" value={currentItem?.linkText} optional />
            <Field name="linkUrl" label="Link URL" value={currentItem?.linkUrl} optional />
            <Field name="imagePath" label="Image URL/path" value={currentItem?.imagePath} optional />
            <Field name="videoPath" label="Video URL/path" value={currentItem?.videoPath} optional />
            <SingleFilePreview name="imageFile" label="Upload image/icon/fallback image" accept="image/jpeg,image/png,image/webp" existingUrl={currentItem?.imagePath} />
            <SingleFilePreview name="videoFile" label="Upload video" accept="video/mp4,video/webm" existingUrl={currentItem?.videoPath} isVideo />
            {currentItem?.imagePath ? <label className="check-field"><input type="checkbox" name="deleteImage" /> Delete current image</label> : null}
            {currentItem?.videoPath ? <label className="check-field"><input type="checkbox" name="deleteVideo" /> Delete current video</label> : null}
            <Field name="sortOrder" label="Sort order" type="number" value={currentItem?.sortOrder ?? selectedSection.items.length} />
            <Area name="settingsJson" label="Settings JSON" value={pretty(currentItem?.settingsJson)} optional rows={6} />
            <label className="check-field"><input type="checkbox" name="isPublished" defaultChecked={currentItem?.isPublished ?? true} /> Published</label>
            <div className="admin-form-actions"><button className="btn">{currentItem ? "Save item" : "Add item"}</button>{currentItem ? <Link className="btn secondary" href={`/admin/pages/${page.pageKey}?section=${selectedSection.id}`}>Cancel</Link> : null}</div>
          </form>
        </div>
      ) : null}
    </div>
  );
}

function pretty(value: unknown) {
  return value ? JSON.stringify(value, null, 2) : "";
}

function Field({ name, label, value, type = "text", optional = false }: { name: string; label: string; value?: string | number | null; type?: string; optional?: boolean }) {
  return <label className="field"><span>{label}</span><input name={name} type={type} defaultValue={value ?? ""} required={!optional} /></label>;
}

function Area({ name, label, value, optional = false, rows = 4 }: { name: string; label: string; value?: string | null; optional?: boolean; rows?: number }) {
  return <label className="field wide"><span>{label}</span><textarea name={name} rows={rows} defaultValue={value ?? ""} required={!optional} /></label>;
}
