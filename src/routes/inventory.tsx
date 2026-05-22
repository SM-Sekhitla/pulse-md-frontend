import { createFileRoute } from "@/lib/router-compat";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/badge-pill";
import {
  formatZAR,
  type InventoryItem,
  myScopedStore,
  receiveStock,
  adjustStock,
  INVENTORY_CATEGORIES,
} from "@/lib/store";
import { differenceInDays, format, parseISO } from "date-fns";
import { Plus, Search, Minus } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

export const Route = createFileRoute("/inventory")({
  component: Inventory,
});

function Inventory() {
  const [data, setData] = useState(() => myScopedStore());
  const refresh = () => setData(myScopedStore());
  useEffect(() => { refresh(); }, []);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("");
  const [receiveOpen, setReceiveOpen] = useState(false);
  const [adjustItem, setAdjustItem] = useState<InventoryItem | null>(null);

  const items = useMemo(() => data.inventory.filter((i) => {
    return (!q || i.name.toLowerCase().includes(q.toLowerCase()) || i.sku.toLowerCase().includes(q.toLowerCase()))
      && (!cat || i.category === cat);
  }), [data.inventory, q, cat]);

  const totalValue = data.inventory.reduce((s, i) => s + i.stock * i.unitCost, 0);
  const lowStock = data.inventory.filter((i) => i.stock <= i.reorderLevel).length;
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
        <Stat label="Below reorder" value={lowStock} tone={lowStock > 0 ? "warning" : "neutral"} />
        <Stat label="Expiring < 60 days" value={expiring} tone={expiring > 0 ? "danger" : "neutral"} />
      </div>

      <div className="mt-6 pulse-card">
        <div className="flex flex-wrap items-center gap-3 border-b border-border px-5 py-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products or SKU…"
              className="h-9 w-full rounded-md border border-border bg-white pl-9 pr-3 text-[13px] outline-none focus:border-blue" />
          </div>
          <select value={cat} onChange={(e) => setCat(e.target.value)} className="h-9 rounded-md border border-border bg-white px-3 text-[13px]">
            <option value="">All categories</option>
            {cats.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <button
            onClick={() => setReceiveOpen(true)}
            className="ml-auto inline-flex items-center gap-1.5 rounded-md bg-blue px-3.5 py-1.5 text-[13px] font-medium text-white hover:opacity-90">
            <Plus className="h-4 w-4" /> Receive stock
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-[13px]">
            <thead className="bg-surface text-left">
              <tr>
                <Th>Product</Th><Th>Category</Th><Th>SKU</Th><Th>Stock</Th><Th>Reorder at</Th>
                <Th>Unit cost</Th><Th>Selling</Th><Th>Expiry</Th><Th>Status</Th><Th>Actions</Th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 && (
                <tr><td colSpan={10} className="px-5 py-10 text-center text-muted-foreground">
                  No inventory yet. Click "Receive stock" to add your first item.
                </td></tr>
              )}
              {items.map((i) => (
                <Row key={i.id} item={i} onAdjust={() => setAdjustItem(i)} />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ReceiveStockDialog
        open={receiveOpen}
        onOpenChange={setReceiveOpen}
        existing={data.inventory}
        onDone={() => { refresh(); }}
      />
      <AdjustStockDialog
        item={adjustItem}
        onOpenChange={(o) => { if (!o) setAdjustItem(null); }}
        onDone={() => { refresh(); setAdjustItem(null); }}
      />
    </AppShell>
  );
}

function Stat({ label, value, tone = "neutral" }: { label: string; value: any; tone?: "neutral" | "warning" | "danger" }) {
  const ring = tone === "danger" ? "border-[#FECACA] bg-[#FEF2F2]" : tone === "warning" ? "border-[#FED7AA] bg-[#FFFBEB]" : "";
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
function Row({ item, onAdjust }: { item: InventoryItem; onAdjust: () => void }) {
  const expDays = differenceInDays(parseISO(item.expiry), new Date());
  const expired = expDays < 0;
  const expiringSoon = expDays >= 0 && expDays < 60;
  const lowStock = item.stock <= item.reorderLevel;
  const rowBg = expired ? "bg-[#FEF2F2]" : expiringSoon ? "bg-[#FFFBEB]" : "";
  return (
    <tr className={`border-b border-border last:border-0 hover:bg-blue-tint ${rowBg}`}>
      <td className="px-5 py-3 font-medium text-navy">{item.name}</td>
      <td className="px-5 py-3 text-muted-foreground">{item.category}</td>
      <td className="px-5 py-3 font-mono text-[12px] text-muted-foreground">{item.sku}</td>
      <td className={`px-5 py-3 font-mono ${lowStock ? "font-semibold text-warning" : "text-navy"}`}>{item.stock}</td>
      <td className="px-5 py-3 font-mono text-muted-foreground">{item.reorderLevel}</td>
      <td className="px-5 py-3 text-navy">{formatZAR(item.unitCost)}</td>
      <td className="px-5 py-3 text-navy">{item.sellingPrice ? formatZAR(item.sellingPrice) : "—"}</td>
      <td className="px-5 py-3 text-muted-foreground">{format(parseISO(item.expiry), "d MMM yyyy")}</td>
      <td className="px-5 py-3">
        {expired ? <Badge variant="danger">Expired</Badge>
          : lowStock ? <Badge variant="warning">Low stock</Badge>
          : expiringSoon ? <Badge variant="warning">Expiring soon</Badge>
          : <Badge variant="success">In stock</Badge>}
      </td>
      <td className="px-5 py-3">
        <button
          onClick={onAdjust}
          className="inline-flex items-center gap-1 rounded-md border border-border bg-white px-2.5 py-1 text-[12px] font-medium text-navy hover:bg-blue-tint">
          <Minus className="h-3 w-3" /> Adjust
        </button>
      </td>
    </tr>
  );
}

// ─── Receive stock dialog ───────────────────────────

function ReceiveStockDialog({
  open, onOpenChange, existing, onDone,
}: {
  open: boolean;
  onOpenChange: (b: boolean) => void;
  existing: InventoryItem[];
  onDone: () => void;
}) {
  const [mode, setMode] = useState<"new" | "existing">("new");
  const [itemId, setItemId] = useState<string>("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState<string>("Prescription medication");
  const [sku, setSku] = useState("");
  const [quantity, setQuantity] = useState<number>(1);
  const [unitCost, setUnitCost] = useState<number>(0);
  const [sellingPrice, setSellingPrice] = useState<number>(0);
  const [reorderLevel, setReorderLevel] = useState<number>(10);
  const [expiry, setExpiry] = useState<string>("");
  const [supplier, setSupplier] = useState("");

  useEffect(() => {
    if (open) {
      setMode(existing.length > 0 ? "existing" : "new");
      setItemId(existing[0]?.id ?? "");
      setName(""); setSku(""); setQuantity(1);
      setUnitCost(0); setSellingPrice(0); setReorderLevel(10);
      setExpiry(""); setSupplier(""); setCategory("Prescription medication");
    }
  }, [open, existing]);

  const submit = () => {
    if (quantity <= 0) { toast.error("Quantity must be greater than 0"); return; }
    if (mode === "new" && !name.trim()) { toast.error("Product name required"); return; }
    if (mode === "existing" && !itemId) { toast.error("Select a product"); return; }
    receiveStock({
      itemId: mode === "existing" ? itemId : undefined,
      name: mode === "new" ? name : undefined,
      category: mode === "new" ? category : undefined,
      sku: mode === "new" ? (sku || undefined) : undefined,
      quantity,
      unitCost: mode === "new" ? unitCost : (unitCost || undefined),
      sellingPrice: mode === "new" ? sellingPrice : (sellingPrice || undefined),
      reorderLevel: mode === "new" ? reorderLevel : undefined,
      expiry: expiry || undefined,
      supplier: supplier || undefined,
    });
    toast.success(mode === "existing" ? "Stock added" : "Item received");
    onDone();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Receive stock</DialogTitle>
          <DialogDescription>Add stock to an existing product or create a new SKU.</DialogDescription>
        </DialogHeader>

        <div className="flex gap-2 rounded-md border border-border p-1">
          <button
            type="button"
            onClick={() => setMode("existing")}
            disabled={existing.length === 0}
            className={`flex-1 rounded px-3 py-1.5 text-[13px] font-medium ${mode === "existing" ? "bg-blue text-white" : "text-navy"} disabled:opacity-50`}>
            Add to existing
          </button>
          <button
            type="button"
            onClick={() => setMode("new")}
            className={`flex-1 rounded px-3 py-1.5 text-[13px] font-medium ${mode === "new" ? "bg-blue text-white" : "text-navy"}`}>
            New product
          </button>
        </div>

        <div className="space-y-3">
          {mode === "existing" ? (
            <div>
              <Label>Product</Label>
              <Select value={itemId} onValueChange={setItemId}>
                <SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger>
                <SelectContent>
                  {existing.map((i) => (
                    <SelectItem key={i.id} value={i.id}>
                      {i.name} <span className="text-muted-foreground">· {i.sku} · stock {i.stock}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <Label>Product name</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Amoxicillin 500mg" />
                </div>
                <div>
                  <Label>Category</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {INVENTORY_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>SKU (optional)</Label>
                  <Input value={sku} onChange={(e) => setSku(e.target.value)} placeholder="auto" />
                </div>
                <div>
                  <Label>Reorder level</Label>
                  <Input type="number" min={0} value={reorderLevel} onChange={(e) => setReorderLevel(+e.target.value)} />
                </div>
                <div>
                  <Label>Supplier</Label>
                  <Input value={supplier} onChange={(e) => setSupplier(e.target.value)} />
                </div>
              </div>
            </>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Quantity received</Label>
              <Input type="number" min={1} value={quantity} onChange={(e) => setQuantity(+e.target.value)} />
            </div>
            <div>
              <Label>Expiry date</Label>
              <Input type="date" value={expiry} onChange={(e) => setExpiry(e.target.value)} />
            </div>
            <div>
              <Label>Unit cost (R)</Label>
              <Input type="number" min={0} step="0.01" value={unitCost} onChange={(e) => setUnitCost(+e.target.value)} />
            </div>
            <div>
              <Label>Selling price (R)</Label>
              <Input type="number" min={0} step="0.01" value={sellingPrice} onChange={(e) => setSellingPrice(+e.target.value)} />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Adjust stock dialog ────────────────────────────

function AdjustStockDialog({
  item, onOpenChange, onDone,
}: {
  item: InventoryItem | null;
  onOpenChange: (b: boolean) => void;
  onDone: () => void;
}) {
  const [action, setAction] = useState<"remove" | "add">("remove");
  const [qty, setQty] = useState<number>(1);
  const [reason, setReason] = useState<string>("Dispensed");

  useEffect(() => {
    if (item) { setAction("remove"); setQty(1); setReason("Dispensed"); }
  }, [item]);

  if (!item) return null;

  const submit = () => {
    if (qty <= 0) { toast.error("Quantity must be greater than 0"); return; }
    const delta = action === "remove" ? -qty : qty;
    if (action === "remove" && qty > item.stock) {
      toast.error(`Only ${item.stock} in stock`);
      return;
    }
    adjustStock(item.id, delta, reason);
    toast.success(`Stock updated · ${item.name}`);
    onDone();
  };

  return (
    <Dialog open={!!item} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Adjust stock</DialogTitle>
          <DialogDescription>{item.name} · current stock: {item.stock}</DialogDescription>
        </DialogHeader>

        <div className="flex gap-2 rounded-md border border-border p-1">
          <button
            type="button"
            onClick={() => setAction("remove")}
            className={`flex-1 rounded px-3 py-1.5 text-[13px] font-medium ${action === "remove" ? "bg-blue text-white" : "text-navy"}`}>
            Take out
          </button>
          <button
            type="button"
            onClick={() => setAction("add")}
            className={`flex-1 rounded px-3 py-1.5 text-[13px] font-medium ${action === "add" ? "bg-blue text-white" : "text-navy"}`}>
            Add back
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <Label>Quantity</Label>
            <Input type="number" min={1} value={qty} onChange={(e) => setQty(+e.target.value)} />
          </div>
          <div>
            <Label>Reason</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {action === "remove" ? (
                  <>
                    <SelectItem value="Dispensed">Dispensed to patient</SelectItem>
                    <SelectItem value="Used in procedure">Used in procedure</SelectItem>
                    <SelectItem value="Damaged">Damaged</SelectItem>
                    <SelectItem value="Expired">Expired / discarded</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </>
                ) : (
                  <>
                    <SelectItem value="Returned">Returned</SelectItem>
                    <SelectItem value="Stocktake correction">Stocktake correction</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="rounded-md bg-surface px-3 py-2 text-[13px] text-muted-foreground">
            New stock will be:{" "}
            <span className="font-semibold text-navy">
              {Math.max(0, item.stock + (action === "remove" ? -qty : qty))}
            </span>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit}>Update stock</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
