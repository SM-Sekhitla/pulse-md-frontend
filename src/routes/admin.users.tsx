import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin-shell";
import { Badge } from "@/components/badge-pill";
import { store } from "@/lib/store";

export const Route = createFileRoute("/admin/users")({ component: AdminUsers });

function AdminUsers() {
  const s = store.get();
  const users = s.users.filter(u => !u.deletedAt);
  return (
    <AdminShell title="Users">
      <div className="pulse-card overflow-hidden">
        <table className="w-full text-[13px]">
          <thead className="bg-surface text-[11px] uppercase tracking-wider text-muted-foreground">
            <tr><th className="px-5 py-3 text-left">Name</th><th className="px-5 py-3 text-left">Email</th><th className="px-5 py-3 text-left">Role</th><th className="px-5 py-3 text-left">Tenant</th><th className="px-5 py-3 text-left">Status</th></tr>
          </thead>
          <tbody>
            {users.map(u => {
              const t = s.tenants.find(x => x.id === u.tenantId);
              return (
                <tr key={u.id} className="border-t border-border">
                  <td className="px-5 py-3 font-medium text-navy">{u.title} {u.firstName} {u.lastName}</td>
                  <td className="px-5 py-3 text-muted-foreground">{u.email}</td>
                  <td className="px-5 py-3 capitalize">{u.role.replace("_", " ")}</td>
                  <td className="px-5 py-3 text-muted-foreground">{t?.name || "—"}</td>
                  <td className="px-5 py-3"><Badge variant={u.status === "active" ? "success" : u.status === "invited" ? "warning" : "neutral"}>{u.status}</Badge></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
