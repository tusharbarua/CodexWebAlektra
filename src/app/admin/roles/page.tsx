import { deleteRole, saveRole } from "@/app/admin/actions";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const modules = ["Dashboard", "Pages", "Products", "Categories", "Orders", "Projects", "Resources", "Hero Media", "Footer Settings", "SEO", "Integrations", "Thermal Inspections", "Contact Submissions", "Users", "Roles", "Site Settings"];
const actions = ["View", "Create", "Edit", "Delete", "Publish", "Export", "Manage Settings"];

export default async function AdminRolesPage({ searchParams }: { searchParams: Promise<{ edit?: string }> }) {
  const { edit } = await searchParams;
  const [roles, current] = await Promise.all([
    prisma.appRole.findMany({ include: { permissions: true, users: true }, orderBy: { name: "asc" } }),
    edit ? prisma.appRole.findUnique({ where: { id: edit }, include: { permissions: true } }) : null
  ]);
  const selected = new Set(current?.permissions.map((permission) => `${permission.module}:${permission.action}`) ?? []);

  return (
    <div>
      <p className="kicker">Roles</p>
      <h1>{current ? "Edit role permissions" : "Role permission management"}</h1>
      <form action={saveRole} className="panel admin-form">
        <input type="hidden" name="id" value={current?.id ?? ""} />
        <Field name="name" label="Role name" value={current?.name} />
        <Field name="description" label="Description" value={current?.description} optional />
        <div className="field wide">
          <span>Permissions</span>
          <div className="permission-grid">
            {modules.map((module) => (
              <div className="permission-card" key={module}>
                <strong>{module}</strong>
                {actions.map((action) => {
                  const value = `${module}:${action}`;
                  return <label className="check-field compact-check" key={value}><input type="checkbox" name="permission" value={value} defaultChecked={current?.name === "Super Admin" || selected.has(value)} disabled={current?.name === "Super Admin"} /> {action}</label>;
                })}
              </div>
            ))}
          </div>
        </div>
        <div className="admin-form-actions"><button className="btn">{current ? "Save role" : "Create role"}</button>{current ? <a className="btn secondary" href="/admin/roles">Cancel</a> : null}</div>
      </form>
      <table className="table"><thead><tr><th>Role</th><th>Users</th><th>Permissions</th><th>Actions</th></tr></thead><tbody>
        {roles.map((role) => <tr key={role.id}><td>{role.name}{role.isSystem ? " (system)" : ""}</td><td>{role.users.length}</td><td>{role.name === "Super Admin" ? "All permissions" : role.permissions.length}</td><td className="table-actions"><a className="btn secondary compact" href={`/admin/roles?edit=${role.id}`}>Edit</a><form action={deleteRole}><input type="hidden" name="id" value={role.id} /><button className="btn danger compact" disabled={role.isSystem || role.users.length > 0}>Delete</button></form></td></tr>)}
      </tbody></table>
    </div>
  );
}

function Field({ name, label, value, optional = false }: { name: string; label: string; value?: string | null; optional?: boolean }) {
  return <label className="field"><span>{label}</span><input name={name} defaultValue={value ?? ""} required={!optional} /></label>;
}
