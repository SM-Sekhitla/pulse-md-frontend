import { createFileRoute } from "@/lib/router-compat";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/badge-pill";
import { store, formatZAR, type InventoryItem } from "@/lib/store";
import { differenceInDays, format, parseISO } from "date-fns";
import { Plus, Search, Package } from "lucide-react";

export const Route = createFileRoute("/inventory")({
  component: Inventory,
});

function Inventory() {
  const [data, setData] = useState(() => store.get());
  useEffect(() => {
    setData(store.get());
  }, []);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("");

  const items = useMemo(
    () =>
      data.inventory.filter((i) => {
        return (
          (!q ||
            i.name.toLowerCase().includes(q.toLowerCase()) ||
            i.sku.toLowerCase().includes(q.toLowerCase())) &&
          (!cat || i.category === cat)
        );
      }),
    [data.inventory, q, cat],
  );

  const totalValue = data.inventory.reduce(
    (s, i) => s + i.stock * i.unitCost,
    0,
  );
  const lowStock = data.inventory.filter(
    (i) => i.stock <= i.reorderLevel,
  ).length;
  const expiring = data.inventory.filter((i) => {
    const d = differenceInDays(parseISO(i.expiry), new Date());
    return d > 0 && d < 60;
  }).length;
  const cats = Array.from(new Set(data.inventory.map((i) => i.category)));

  return (
    <AppShell title="Medical inventory">
      <div className="grid gap-4 md:grid-cols-4">
        <Stat label="Active SKUs" value={data.inventory.length} />
        <Stat label="Total stock value" value={formatZAR(totalValue)} />
        <Stat
          label="Below reorder"
          value={lowStock}
          tone={lowStock > 0 ? "warning" : "neutral"}
        />
        <Stat
          label="Expiring < 60 days"
          value={expiring}
          tone={expiring > 0 ? "danger" : "neutral"}
        />
      </div>

      <div className="mt-6 pulse-card">
        <div className="flex flex-wrap items-center gap-3 border-b border-border px-5 py-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search products or SKU…"
              className="h-9 w-full rounded-md border border-border bg-white pl-9 pr-3 text-[13px] outline-none focus:border-blue"
            />
          </div>
          <select
            value={cat}
            onChange={(e) => setCat(e.target.value)}
            className="h-9 rounded-md border border-border bg-white px-3 text-[13px]"
          >
            <option value="">All categories</option>
            {cats.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <button className="ml-auto inline-flex items-center gap-1.5 rounded-md bg-blue px-3.5 py-1.5 text-[13px] font-medium text-white hover:opacity-90">
            <Plus className="h-4 w-4" /> Receive stock
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-[13px]">
            <thead className="bg-surface text-left">
              <tr>
                <Th>Product</Th>
                <Th>Category</Th>
                <Th>SKU</Th>
                <Th>Stock</Th>
                <Th>Reorder at</Th>
                <Th>Unit cost</Th>
                <Th>Selling</Th>
                <Th>Expiry</Th>
                <Th>Status</Th>
              </tr>
            </thead>
            <tbody>
              {items.map((i) => (
                <Row key={i.id} item={i} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}

function Stat({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: any;
  tone?: "neutral" | "warning" | "danger";
}) {
  const ring =
    tone === "danger"
      ? "border-[#FECACA] bg-[#FEF2F2]"
      : tone === "warning"
        ? "border-[#FED7AA] bg-[#FFFBEB]"
        : "";
  return (
    <div className={`pulse-card p-5 ${ring}`}>
      <div className="label-caps">{label}</div>
      <div className="mt-2 text-[24px] font-bold text-navy">{value}</div>
    </div>
  );
}
function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-5 py-2.5 label-caps font-semibold">{children}</th>;
}
function Row({ item }: { item: InventoryItem }) {
  const expDays = differenceInDays(parseISO(item.expiry), new Date());
  const expired = expDays < 0;
  const expiringSoon = expDays >= 0 && expDays < 60;
  const lowStock = item.stock <= item.reorderLevel;
  const rowBg = expired ? "bg-[#FEF2F2]" : expiringSoon ? "bg-[#FFFBEB]" : "";
  return (
    <tr
      className={`border-b border-border last:border-0 hover:bg-blue-tint ${rowBg}`}
    >
      <td className="px-5 py-3 font-medium text-navy">{item.name}</td>
      <td className="px-5 py-3 text-muted-foreground">{item.category}</td>
      <td className="px-5 py-3 font-mono text-[12px] text-muted-foreground">
        {item.sku}
      </td>
      <td
        className={`px-5 py-3 font-mono ${lowStock ? "font-semibold text-warning" : "text-navy"}`}
      >
        {item.stock}
      </td>
      <td className="px-5 py-3 font-mono text-muted-foreground">
        {item.reorderLevel}
      </td>
      <td className="px-5 py-3 text-navy">{formatZAR(item.unitCost)}</td>
      <td className="px-5 py-3 text-navy">
        {item.sellingPrice ? formatZAR(item.sellingPrice) : "—"}
      </td>
      <td className="px-5 py-3 text-muted-foreground">
        {format(parseISO(item.expiry), "d MMM yyyy")}
      </td>
      <td className="px-5 py-3">
        {expired ? (
          <Badge variant="danger">Expired</Badge>
        ) : lowStock ? (
          <Badge variant="warning">Low stock</Badge>
        ) : expiringSoon ? (
          <Badge variant="warning">Expiring soon</Badge>
        ) : (
          <Badge variant="success">In stock</Badge>
        )}
      </td>
    </tr>
  );
}
