import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin-shell";
import { store } from "@/lib/store";
import { format, parseISO } from "date-fns";

export const Route = createFileRoute("/admin/outbox")({ component: Outbox });

function Outbox() {
  const s = store.get();
  return (
    <AdminShell title="Email outbox">
      <p className="mb-4 text-[12.5px] text-muted-foreground">
        Simulated email sends. In production these would be delivered via Resend.
      </p>
      <div className="pulse-card divide-y divide-border">
        {s.outbox.map(e => (
          <div key={e.id} className="px-5 py-4 text-[13px]">
            <div className="flex items-center justify-between">
              <div className="font-semibold text-navy">{e.subject}</div>
              <div className="text-[11px] text-muted-foreground">{format(parseISO(e.ts), "d MMM yyyy HH:mm")}</div>
            </div>
            <div className="mt-0.5 text-[11.5px] text-muted-foreground">to: <span className="font-mono">{e.to}</span> · {e.kind}</div>
            <pre className="mt-3 whitespace-pre-wrap rounded-md bg-surface px-3 py-2 text-[12px] text-navy">{e.body}</pre>
          </div>
        ))}
        {s.outbox.length === 0 && <div className="px-5 py-10 text-center text-muted-foreground">No emails sent yet.</div>}
      </div>
    </AdminShell>
  );
}
