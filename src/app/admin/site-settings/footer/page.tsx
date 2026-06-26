import { saveFooterSettings } from "@/app/admin/actions";
import { prisma } from "@/lib/prisma";
import { defaultFooterSettings } from "@/lib/site-settings";

export const dynamic = "force-dynamic";

export default async function AdminFooterSettingsPage({
  searchParams
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const params = await searchParams;
  const settings = await prisma.siteSettings.findUnique({ where: { singletonKey: "footer" } });
  const current = settings ?? defaultFooterSettings;
  return (
    <div>
      <p className="kicker">Site settings</p>
      <h1>Universal footer.</h1>
      {params.saved ? <div className="admin-success">Footer settings saved.</div> : null}
      <form action={saveFooterSettings} className="panel admin-form">
        <Field label="Contact email" name="contactEmail" value={current.contactEmail} type="email" required />
        <Field label="Contact phone" name="contactPhone" value={current.contactPhone} required />
        <Field label="Address" name="address" value={current.address} required />
        <Field label="Facebook link" name="facebookUrl" value={current.facebookUrl ?? ""} />
        <Field label="LinkedIn link" name="linkedinUrl" value={current.linkedinUrl ?? ""} />
        <Field label="YouTube link" name="youtubeUrl" value={current.youtubeUrl ?? ""} />
        <Field label="WhatsApp number" name="whatsappNumber" value={current.whatsappNumber ?? ""} />
        <TextArea label="Footer short company description" name="footerDescription" value={current.footerDescription} required />
        <TextArea label="Copyright text" name="copyrightText" value={current.copyrightText} required />
        <div className="admin-form-actions">
          <button className="btn" type="submit">Save footer settings</button>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  name,
  value,
  type = "text",
  required = false
}: {
  label: string;
  name: string;
  value?: string | null;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <input name={name} type={type} defaultValue={value ?? ""} required={required} />
    </label>
  );
}

function TextArea({
  label,
  name,
  value,
  required = false
}: {
  label: string;
  name: string;
  value?: string | null;
  required?: boolean;
}) {
  return (
    <label className="field wide">
      <span>{label}</span>
      <textarea name={name} rows={4} defaultValue={value ?? ""} required={required} />
    </label>
  );
}
