import { createFileRoute } from "@/lib/router-compat";
import { AdminShell } from "@/components/admin-shell";
import { format, parseISO } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import API from "@/utils/api";

export const Route = createFileRoute("/admin/outbox")({ component: Outbox });

function Outbox() {
  const { data: outbox = [], isLoading } = useQuery({
    queryKey: ["email-outbox"],
    queryFn: async () => {
      const res = await API.get("/logs/outbox");
      return res.data as Array<{
        id: string;
        to: string;
        subject: string;
        body: string;
        backend: string;
        status: string;
        error?: string;
        createdAt: string;
      }>;
    },
  });

  return (
    <AdminShell title="Email outbox">
      <p className="mb-4 text-[12.5px] text-muted-foreground">
        Email delivery attempts from the configured SMTP/provider backend.
      </p>
      <div className="pulse-card divide-y divide-border">
        {outbox.map((e) => (
          <div key={e.id} className="px-5 py-4 text-[13px]">
            <div className="flex items-center justify-between">
              <div className="font-semibold text-navy">{e.subject}</div>
              <div className="text-[11px] text-muted-foreground">
                {format(parseISO(e.createdAt), "d MMM yyyy HH:mm")}
              </div>
            </div>
            <div className="mt-0.5 text-[11.5px] text-muted-foreground">
              to: <span className="font-mono">{e.to}</span> · {e.backend} · {e.status}
            </div>
            {e.error && (
              <div className="mt-2 rounded-md bg-[#FEF2F2] px-3 py-2 text-[12px] text-[#991B1B]">
                {e.error}
              </div>
            )}
            <pre className="mt-3 whitespace-pre-wrap rounded-md bg-surface px-3 py-2 text-[12px] text-navy">
              {e.body}
            </pre>
          </div>
        ))}
        {!isLoading && outbox.length === 0 && (
          <div className="px-5 py-10 text-center text-muted-foreground">
            No emails sent yet.
          </div>
        )}
        {isLoading && (
          <div className="px-5 py-10 text-center text-muted-foreground">
            Loading email delivery attempts...
          </div>
        )}
      </div>
    </AdminShell>
  );
}
