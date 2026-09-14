import { createFileRoute } from "@/lib/router-compat";
import { useEffect, useMemo, useState } from "react";
import { AdminShell } from "@/components/admin-shell";
import { AdminPagination } from "@/components/admin-pagination";
import { format, parseISO } from "date-fns";
import { useData } from "@/context/AppDataProvider";

export const Route = createFileRoute("/admin/audit")({ component: Audit });

const PAGE_SIZE = 20;

function Audit() {
  const { audit } = useData();
  const [page, setPage] = useState(1);
  const pageCount = Math.max(1, Math.ceil(audit.audits.length / PAGE_SIZE));
  const pageEvents = useMemo(
    () => audit.audits.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [audit.audits, page],
  );

  useEffect(() => {
    if (page > pageCount) {
      setPage(pageCount);
    }
  }, [page, pageCount]);

  return (
    <AdminShell title="Audit log">
      <div className="pulse-card overflow-hidden">
        <div className="divide-y divide-border">
          {pageEvents.map((e) => (
            <div key={e.id} className="px-5 py-3 text-[13px]">
              <div className="flex items-center justify-between gap-4">
                <div className="font-medium text-navy">{e.message}</div>
                <div className="shrink-0 text-[11px] text-muted-foreground">
                  {format(parseISO(e.ts), "d MMM yyyy HH:mm")}
                </div>
              </div>
              <div className="mt-0.5 text-[11.5px] text-muted-foreground">
                {e.type}
                {e.actorEmail ? ` · ${e.actorEmail}` : ""}
              </div>
            </div>
          ))}
          {!audit.isLoading && audit.audits.length === 0 && (
            <div className="px-5 py-10 text-center text-muted-foreground">
              No events.
            </div>
          )}
        </div>
        <AdminPagination
          page={page}
          pageSize={PAGE_SIZE}
          totalItems={audit.audits.length}
          onPageChange={setPage}
        />
      </div>
    </AdminShell>
  );
}
