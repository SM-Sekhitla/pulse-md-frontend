import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AdminShell } from "@/components/admin-shell";
import { Badge } from "@/components/badge-pill";
import { approveTenant, rejectTenant, store } from "@/lib/store";
import { format, parseISO } from "date-fns";

export const Route = createFileRoute("/admin/practices/pending")({ component: Pending });

function Pending() {
  const [, refresh] = useState(0);
  const reload = () => refresh(x => x + 1);
  const s = store.get();
  const me = s.user!;
  const rows = s.tenants.filter(t => t.status === "pending_approval");

  const approve = (id: string, name: string) => {
    if (confirm(`Approve ${name}? A temporary password will be generated and emailed to the GP.`)) {
      approveTenant(id, me);
      reload();
      alert(`${name} approved. The approval email with the temporary password is in the Email outbox.`);
    }
  };
  const reject = (id: string, name: string) => {
    const reason = prompt(`Reject ${name}? Provide a reason:`);
    if (reason) { rejectTenant(id, reason, me); reload(); }
  };

  if (rows.length === 0) {
    return (
      <AdminShell title="Pending approval">
        <div className="pulse-card p-12 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#DCFCE7] text-[#166534]">✓</div>
          <div className="text-[16px] font-semibold text-navy">No pending applications</div>
          <p className="mt-2 text-[13px] text-muted-foreground">All caught up.</p>
        </div>
      </AdminShell>
    );
  }

  return (
    <AdminShell title="Pending approval">
      <div className="pulse-card overflow-hidden">
        <table className="w-full text-[13px]">
          <thead className="bg-surface text-[11px] uppercase tracking-wider text-muted-foreground">
            <tr><Th>Practice</Th><Th>GP</Th><Th>HPCSA</Th><Th>Plan</Th><Th>Registered</Th><Th className="text-right">Action</Th></tr>
          </thead>
          <tbody>
            {rows.map(t => {
              const owner = s.users.find(u => u.id === t.gpUserId);
              return (
                <tr key={t.id} className="border-t border-border hover:bg-surface">
                  <Td><Link to="/admin/practices/$id" params={{ id: t.id }} className="font-semibold text-navy hover:text-blue">{t.name}</Link></Td>
                  <Td>{owner?.title} {owner?.firstName} {owner?.lastName}<div className="text-[11px] text-muted-foreground">{owner?.email}</div></Td>
                  <Td className="font-mono text-[12px]">{t.hpcsa}</Td>
                  <Td><Badge variant="blue">{t.plan}</Badge></Td>
                  <Td className="text-muted-foreground">{format(parseISO(t.createdAt), "d MMM yyyy")}</Td>
                  <Td className="text-right">
                    <button onClick={() => approve(t.id, t.name)} className="mr-2 rounded-md bg-success px-3 py-1.5 text-[12.5px] font-medium text-white hover:opacity-90">Approve</button>
                    <button onClick={() => reject(t.id, t.name)} className="rounded-md border border-border bg-white px-3 py-1.5 text-[12.5px] font-medium text-[#991B1B] hover:bg-[#FEF2F2]">Reject</button>
                  </Td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}

function Th({ children, className = "" }: { children: React.ReactNode; className?: string }) { return <th className={`px-5 py-3 text-left font-semibold ${className}`}>{children}</th>; }
function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) { return <td className={`px-5 py-3 ${className}`}>{children}</td>; }
