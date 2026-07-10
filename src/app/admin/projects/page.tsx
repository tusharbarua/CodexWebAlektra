import { deleteProject, saveProject } from "@/app/admin/actions";
import { ProjectImageManager } from "@/components/ProjectImageManager";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminProjectsPage({ searchParams }: { searchParams: Promise<{ edit?: string; error?: string }> }) {
  const { edit, error } = await searchParams;
  const [projects, current] = await Promise.all([
    prisma.project.findMany({ include: { images: { orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }] } }, orderBy: { updatedAt: "desc" } }),
    edit ? prisma.project.findUnique({ where: { id: edit }, include: { images: { orderBy: { sortOrder: "asc" } } } }) : null
  ]);
  return <div><p className="kicker">Projects</p><h1>{current ? "Edit completed project" : "Completed project management"}</h1>
    {error ? <div className="admin-error">{decodeURIComponent(error)}</div> : null}
    <form action={saveProject} className="panel admin-form">
      <input type="hidden" name="id" value={current?.id ?? ""} />
      <Field name="title" label="Project name" value={current?.title} /><Field name="slug" label="Slug (optional, auto-generated from project name)" value={current?.slug} optional />
      <Field name="clientName" label="Client name" value={current?.clientName} optional /><Field name="location" label="Location" value={current?.location} />
      <Field name="projectType" label="Project type" value={current?.projectType} /><Field name="capacityKw" label="Capacity (kW)" type="number" value={current ? Number(current.capacityKw) : undefined} />
      <Field name="inverterBrandModel" label="Inverter brand/model" value={current?.inverterBrandModel} optional /><Field name="moduleBrandModel" label="Module brand/model" value={current?.moduleBrandModel} optional />
      <Field name="commissionedAt" label="Commissioning date" type="date" value={current?.commissionedAt?.toISOString().slice(0, 10)} optional />
      <Field name="coverImage" label="Optional cover image URL" value={current?.coverImage} optional /><Field name="videoUrl" label="Video URL" value={current?.videoUrl} optional />
      <ProjectImageManager existingImages={(current?.images ?? []).map((image) => ({ id: image.id, imagePath: image.imagePath, altText: image.altText, sortOrder: image.sortOrder, isPrimary: image.isPrimary }))} />
      <Area name="summary" label="Short description" value={current?.summary} />
      <Area
        name="fullCaseStudy"
        label="Case Study"
        value={current?.fullCaseStudy}
        rows={8}
        optional
        help="This will not appear in the Our Projects card. It can be published as a Resources article using 'Feature this on Resources'."
      />
      <label className="field admin-checkbox-field">
        <input type="checkbox" name="isFeatured" defaultChecked={current?.isFeatured ?? false} />
        <span>Featured on homepage projects section</span>
        <small>When enabled, this project becomes the default featured project in the homepage Our Projects section.</small>
      </label>
      <label className="field admin-checkbox-field wide">
        <input type="checkbox" name="featureOnResources" defaultChecked={current?.featureOnResources ?? false} />
        <span>Feature this on Resources</span>
        <small>Creates or updates a Resources knowledge article using this project name, image, and case study. Disabling this will unpublish the linked Resources article but keep the saved content.</small>
      </label>
      <label className="field"><span>Status</span><select name="status" defaultValue={current?.status ?? "DRAFT"}><option>DRAFT</option><option>PUBLISHED</option><option>UNPUBLISHED</option></select></label>
      <div className="admin-form-actions"><button className="btn">{current ? "Save changes" : "Add project"}</button>{current ? <a className="btn secondary" href="/admin/projects">Cancel</a> : null}</div>
    </form>
    <table className="table"><thead><tr><th>Project</th><th>Location</th><th>Capacity</th><th>Images</th><th>Status</th><th>Actions</th></tr></thead><tbody>{projects.map((project) => <tr key={project.id}><td>{project.title}</td><td>{project.location}</td><td>{Number(project.capacityKw)} kW</td><td>{project.images.length}</td><td>{project.status}</td><td className="table-actions"><a className="btn secondary compact" href={`/admin/projects?edit=${project.id}`}>Edit</a><form action={deleteProject}><input type="hidden" name="id" value={project.id} /><button className="btn danger compact">Delete</button></form></td></tr>)}</tbody></table>
  </div>;
}
function Field({ name, label, value, type = "text", optional = false }: { name: string; label: string; value?: string | number | null; type?: string; optional?: boolean }) { return <label className="field"><span>{label}</span><input name={name} type={type} defaultValue={value ?? ""} required={!optional} /></label>; }
function Area({ name, label, value, rows = 4, optional = false, help }: { name: string; label: string; value?: string | null; rows?: number; optional?: boolean; help?: string }) { return <label className="field wide"><span>{label}</span><textarea name={name} rows={rows} defaultValue={value ?? ""} required={!optional} />{help ? <small>{help}</small> : null}</label>; }
