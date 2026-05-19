import { createFileRoute } from "@/lib/router-compat";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/badge-pill";
import { Plus } from "lucide-react";

export const Route = createFileRoute("/equipment")({ component: Equipment });

const EQ = [
  {
    name: "BP Monitor — Omron HEM-7361T",
    serial: "OMR-451",
    room: "Room 1",
    status: "Operational",
    warranty: "2026-08-12",
    next: "2025-11-04",
  },
  {
    name: "ECG Machine — Schiller AT-101",
    serial: "SCH-298",
    room: "Room 2",
    status: "Due for service",
    warranty: "2025-04-01",
    next: "2025-05-15",
  },
  {
    name: "Spirometer — MIR Spirobank",
    serial: "MIR-118",
    room: "Room 3",
    status: "Operational",
    warranty: "2027-01-20",
    next: "2026-02-10",
  },
  {
    name: "Defibrillator — Philips HeartStart",
    serial: "PHL-902",
    room: "Reception",
    status: "Operational",
    warranty: "2026-06-30",
    next: "2025-12-01",
  },
  {
    name: "Otoscope — Welch Allyn",
    serial: "WAL-336",
    room: "Room 1",
    status: "Under maintenance",
    warranty: "2025-09-15",
    next: "2025-06-20",
  },
];

function Equipment() {
  return (
    <AppShell title="Equipment">
      <div className="mb-5 flex justify-between">
        <h2 className="text-[22px] font-semibold text-navy">
          {EQ.length} assets
        </h2>
        <button className="inline-flex items-center gap-1.5 rounded-md bg-blue px-3.5 py-2 text-[13px] font-medium text-white hover:opacity-90">
          <Plus className="h-4 w-4" /> Add equipment
        </button>
      </div>
      <div className="pulse-card overflow-x-auto">
        <table className="min-w-full text-[13px]">
          <thead className="bg-surface text-left">
            <tr>
              {[
                "Equipment",
                "Serial",
                "Location",
                "Warranty",
                "Next service",
                "Status",
              ].map((h) => (
                <th key={h} className="px-5 py-2.5 label-caps font-semibold">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {EQ.map((e) => (
              <tr
                key={e.serial}
                className="border-b border-border last:border-0 hover:bg-blue-tint"
              >
                <td className="px-5 py-3 font-medium text-navy">{e.name}</td>
                <td className="px-5 py-3 font-mono text-[12px] text-muted-foreground">
                  {e.serial}
                </td>
                <td className="px-5 py-3 text-navy">{e.room}</td>
                <td className="px-5 py-3 text-muted-foreground">
                  {e.warranty}
                </td>
                <td className="px-5 py-3 text-muted-foreground">{e.next}</td>
                <td className="px-5 py-3">
                  <Badge
                    variant={
                      e.status === "Operational"
                        ? "success"
                        : e.status === "Due for service"
                          ? "warning"
                          : "blue"
                    }
                  >
                    {e.status}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}
