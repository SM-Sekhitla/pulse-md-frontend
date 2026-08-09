import { createFileRoute } from "@/lib/router-compat";
import { AdminShell } from "@/components/admin-shell";
import { format, parseISO } from "date-fns";
import { useData } from "@/context/AppDataProvider";

export const Route = createFileRoute("/admin/audit")({ component: Audit });

function Audit() {
  const { audit } = useData();
  return (
    <AdminShell title="Audit log">
      <div className="pulse-card divide-y divide-border">
        {audit.audits.map((e) => (
          <div key={e.id} className="px-5 py-3 text-[13px]">
            <div className="flex items-center justify-between">
              <div className="font-medium text-navy">{e.message}</div>
              <div className="text-[11px] text-muted-foreground">
                {format(parseISO(e.ts), "d MMM yyyy HH:mm")}
              </div>
            </div>
            <div className="mt-0.5 text-[11.5px] text-muted-foreground">
              {e.type}
              {e.actorEmail ? ` · ${e.actorEmail}` : ""}
            </div>
          </div>
        ))}
        {audit.audits.length === 0 && (
          <div className="px-5 py-10 text-center text-muted-foreground">
            No events.
          </div>
        )}
      </div>
    </AdminShell>
  );
}
