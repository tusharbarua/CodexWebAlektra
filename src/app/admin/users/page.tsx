import { Role } from "@prisma/client";
import { deleteUser, saveUser } from "@/app/admin/actions";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage({ searchParams }: { searchParams: Promise<{ edit?: string }> }) {
  const { edit } = await searchParams;
  const [users, appRoles, current] = await Promise.all([
    prisma.user.findMany({ include: { appRole: true }, orderBy: { createdAt: "desc" } }),
    prisma.appRole.findMany({ orderBy: { name: "asc" } }),
    edit ? prisma.user.findUnique({ where: { id: edit } }) : null
  ]);

  return (
    <div>
      <p className="kicker">Users</p>
      <h1>{current ? "Edit user" : "User management"}</h1>
      <form action={saveUser} className="panel admin-form">
        <input type="hidden" name="id" value={current?.id ?? ""} />
        <Field name="name" label="Name" value={current?.name} />
        <Field name="email" label="Email" type="email" value={current?.email} />
        <Field name="phone" label="Phone" value={current?.phone} optional />
        <Field name="password" label={current ? "New password / temporary password" : "Temporary password"} type="password" optional={Boolean(current)} />
        <label className="field"><span>System role</span><select name="role" defaultValue={current?.role ?? Role.ADMIN}>{Object.values(Role).map((role) => <option value={role} key={role}>{role}</option>)}</select></label>
        <label className="field"><span>Permission role</span><select name="appRoleId" defaultValue={current?.appRoleId ?? ""}><option value="">None</option>{appRoles.map((role) => <option value={role.id} key={role.id}>{role.name}</option>)}</select></label>
        <label className="check-field"><input type="checkbox" name="isActive" defaultChecked={current?.isActive ?? true} /> Active</label>
        <div className="admin-form-actions"><button className="btn">{current ? "Save user" : "Create user"}</button>{current ? <a className="btn secondary" href="/admin/users">Cancel</a> : null}</div>
      </form>
      <table className="table"><thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Last login</th><th>Actions</th></tr></thead><tbody>
        {users.map((user) => <tr key={user.id}><td>{user.name ?? "Unnamed"}</td><td>{user.email}</td><td>{user.appRole?.name ?? user.role}</td><td>{user.isActive ? "Active" : "Inactive"}</td><td>{user.lastLoginAt?.toLocaleString() ?? "Never"}</td><td className="table-actions"><a className="btn secondary compact" href={`/admin/users?edit=${user.id}`}>Edit</a><form action={deleteUser}><input type="hidden" name="id" value={user.id} /><button className="btn danger compact" disabled={user.role === "SUPER_ADMIN"}>Delete</button></form></td></tr>)}
      </tbody></table>
    </div>
  );
}

function Field({ name, label, value, type = "text", optional = false }: { name: string; label: string; value?: string | null; type?: string; optional?: boolean }) {
  return <label className="field"><span>{label}</span><input name={name} type={type} defaultValue={value ?? ""} required={!optional} /></label>;
}

