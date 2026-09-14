import { createFileRoute } from "@/lib/router-compat";
import { AdminShell } from "@/components/admin-shell";
import { Badge } from "@/components/badge-pill";
import { useData } from "@/context/AppDataProvider";
import { useState } from "react";
import { Search, Users } from "lucide-react";
import { AdminPagination } from "@/components/admin-pagination";

export const Route = createFileRoute("/admin/users")({ component: AdminUsers });

function AdminUsers() {
  const { tenant, user } = useData();
  const [query, setQuery] = useState("");
  const [role, setRole] = useState("all");
  const [page, setPage] = useState(1);
  const users = user.users.filter((u) => {
    if (u.deletedAt || (role !== "all" && u.role !== role)) return false;
    const practice = tenant.tenants.find((item) => item.id === u.tenantId);
    return `${u.firstName} ${u.lastName} ${u.email} ${practice?.name ?? ""}`
      .toLowerCase()
      .includes(query.trim().toLowerCase());
  });
  const pageSize = 20;
  const currentPage = Math.min(
    page,
    Math.max(1, Math.ceil(users.length / pageSize)),
  );
  const pageUsers = users.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );
  return (
    <AdminShell title="Users">
      <div className="admin-filter-bar">
        <label className="admin-search">
          <Search size={17} aria-hidden="true" />
          <span className="sr-only">Search users</span>
          <input
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setPage(1);
            }}
            placeholder="Search name, email or practice…"
          />
        </label>
        <select
          aria-label="Filter users by role"
          value={role}
          onChange={(event) => {
            setRole(event.target.value);
            setPage(1);
          }}
          className="rounded-md border bg-white px-3"
        >
          <option value="all">All roles</option>
          {[
            "super-admin",
            "owner",
            "manager",
            "receptionist",
            "nurse",
            "patient",
          ].map((value) => (
            <option key={value} value={value}>
              {value === "super-admin"
                ? "Super admin"
                : value.charAt(0).toUpperCase() + value.slice(1)}
            </option>
          ))}
        </select>
        <span className="admin-result-count" role="status">
          {users.length} user{users.length === 1 ? "" : "s"}
        </span>
      </div>
      <div className="pulse-card overflow-hidden">
        <table className="w-full text-[13px]">
          <thead className="bg-surface text-[11px] uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-5 py-3 text-left">Name</th>
              <th className="px-5 py-3 text-left">Email</th>
              <th className="px-5 py-3 text-left">Role</th>
              <th className="px-5 py-3 text-left">Practice</th>
              <th className="px-5 py-3 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {pageUsers.map((u) => {
              const t = tenant.tenants.find((x) => x.id === u.tenantId);
              return (
                <tr key={u.id} className="border-t border-border">
                  <td className="px-5 py-3 font-medium text-navy">
                    {u.title} {u.firstName} {u.lastName}
                  </td>
                  <td className="px-5 py-3 text-muted-foreground">{u.email}</td>
                  <td className="px-5 py-3 capitalize">
                    {u.role.replace("_", " ")}
                  </td>
                  <td className="px-5 py-3 text-muted-foreground">
                    {t?.name || "—"}
                  </td>
                  <td className="px-5 py-3">
                    <Badge
                      variant={
                        u.status === "active"
                          ? "success"
                          : u.status === "invited"
                            ? "warning"
                            : "neutral"
                      }
                    >
                      {u.status}
                    </Badge>
                  </td>
                </tr>
              );
            })}
            {user.isLoading && (
              <tr>
                <td
                  colSpan={5}
                  className="px-5 py-10 text-center text-muted-foreground"
                  role="status"
                >
                  Loading users…
                </td>
              </tr>
            )}
            {!user.isLoading && users.length === 0 && (
              <tr>
                <td colSpan={5}>
                  <div className="admin-empty">
                    <span className="admin-empty-icon">
                      <Users size={23} aria-hidden="true" />
                    </span>
                    <h3>No users found</h3>
                    <p>
                      {query || role !== "all"
                        ? "Try another search or choose a different role."
                        : "Platform accounts will appear here when users are added."}
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <AdminPagination
          page={currentPage}
          pageSize={pageSize}
          totalItems={users.length}
          onPageChange={setPage}
        />
      </div>
    </AdminShell>
  );
}
