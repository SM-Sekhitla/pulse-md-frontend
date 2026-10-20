import { useSignaturePin } from "@/components/signature-pin";
import { useRef, useState, type PointerEvent } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { PenLine, RotateCcw, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ActionButton } from "@/components/action-feedback";
import API, { getApiErrorMessage } from "@/utils/api";
import { toast } from "sonner";

type Point = { x: number; y: number };
export function SignatureTemplate() {
  const cache = useQueryClient();
  const signing = useSignaturePin();
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [currentPin, setCurrentPin] = useState("");
  const query = useQuery({
    queryKey: ["signature-template"],
    queryFn: async () =>
      (
        await API.get<{
          signatureDataUrl: string | null;
          pinConfigured: boolean;
          updatedAt: string | null;
        }>("/signature-template")
      ).data,
  });
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [strokes, setStrokes] = useState<Point[][]>([]);
  const paths = useRef<Point[][]>([]);
  const active = useRef<number | null>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const changed = useRef(false);
  function redraw() {
    const ctx = canvas.current?.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.strokeStyle = "#051b2e";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    for (const path of paths.current) {
      if (!path.length) continue;
      ctx.beginPath();
      ctx.moveTo(path[0].x, path[0].y);
      for (const p of path.slice(1)) ctx.lineTo(p.x, p.y);
      ctx.stroke();
    }
    setStrokes([...paths.current]);
  }
  function point(e: PointerEvent<HTMLCanvasElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) * e.currentTarget.width) / rect.width,
      y: ((e.clientY - rect.top) * e.currentTarget.height) / rect.height,
    };
  }
  function close(next: boolean) {
    if (busy) return;
    if (
      !next &&
      changed.current &&
      !window.confirm("Discard this unsaved signature?")
    )
      return;
    setOpen(next);
    if (!next) {
      setPin("");
      setConfirmPin("");
      setCurrentPin("");
    }
  }
  function begin() {
    setPin("");
    setConfirmPin("");
    setCurrentPin("");
    paths.current = [];
    setStrokes([]);
    changed.current = false;
    setError("");
    active.current = null;
    setOpen(true);
  }
  async function save() {
    if (active.current !== null) return;
    if (
      !canvas.current ||
      (!paths.current.some((p) => p.length > 4) &&
        !query.data?.signatureDataUrl)
    ) {
      setError("Draw your signature before saving.");
      return;
    }
    if (!/^\d{6}$/.test(pin) || pin !== confirmPin) {
      setError("Enter a six-digit PIN and matching confirmation.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await API.put("/signature-template", {
        signatureDataUrl: paths.current.length
          ? canvas.current.toDataURL("image/png")
          : query.data?.signatureDataUrl,
        pin,
        currentPin: currentPin || undefined,
      });
      await cache.invalidateQueries({ queryKey: ["signature-template"] });
      changed.current = false;
      setOpen(false);
      setPin("");
      setConfirmPin("");
      setCurrentPin("");
      toast.success(
        "Signature and PIN saved. Enter your PIN each time you sign a document.",
      );
    } catch (e) {
      setError(getApiErrorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  async function remove() {
    if (
      !window.confirm(
        "Remove your signature template? Existing documents will keep their signatures.",
      )
    )
      return;
    setBusy(true);
    try {
      await signing.authorize(async (signaturePin) => {
        await API.delete("/signature-template", { data: { signaturePin } });
        await cache.invalidateQueries({ queryKey: ["signature-template"] });
        toast.success("Signature template removed.");
      });
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="md:col-span-2 max-w-3xl">
      <p className="text-sm text-muted-foreground mb-5">
        Create your reusable handwritten signature and a six-digit PIN. After
        PIN confirmation it will appear above your name on new prescriptions and
        sick notes you issue. Updating it does not change previously issued
        documents.
      </p>
      {query.isPending ? (
        <p role="status">Loading your signature…</p>
      ) : query.isError ? (
        <div role="alert">
          {getApiErrorMessage(query.error)}{" "}
          <ActionButton onClick={() => query.refetch()}>Retry</ActionButton>
        </div>
      ) : (
        <>
          {query.data?.signatureDataUrl && !query.data.pinConfigured && (
            <p
              role="status"
              className="mb-4 rounded-md bg-amber-50 p-3 text-sm text-navy"
            >
              Add a PIN before using this signature on new documents. Open your
              template below; you can keep your existing signature.
            </p>
          )}
          <ActionButton
            disabled={busy}
            className="w-full rounded-xl border-2 border-dashed border-border bg-surface p-6 text-center hover:border-navy focus-visible:outline-2 focus-visible:outline-navy"
            onClick={begin}
            aria-label={
              query.data?.signatureDataUrl
                ? "Edit signature template"
                : "Create signature template"
            }
          >
            {query.data?.signatureDataUrl ? (
              <img
                src={query.data.signatureDataUrl}
                alt="Your saved signature"
                className="mx-auto h-28 w-full max-w-sm object-contain"
              />
            ) : (
              <div className="py-6">
                <PenLine className="mx-auto mb-3 text-navy" size={30} />
                <strong>Click to create your signature</strong>
                <p className="mt-2 text-sm text-muted-foreground">
                  A larger signing pad will open.
                </p>
              </div>
            )}
            <div className="mx-auto mt-3 max-w-sm border-t border-navy pt-3 text-xs text-muted-foreground">
              {query.data?.signatureDataUrl
                ? "Click to edit your signature or set/change its PIN"
                : "Sign with a mouse, trackpad or touch screen"}
            </div>
          </ActionButton>
          {query.data?.signatureDataUrl && (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs text-muted-foreground">
                {query.data.updatedAt &&
                  `Saved ${new Date(query.data.updatedAt).toLocaleString()}`}
              </span>
              <ActionButton
                className="inline-flex items-center gap-2 text-sm text-red-700"
                disabled={busy}
                onClick={remove}
              >
                <Trash2 size={15} />
                Remove template
              </ActionButton>
            </div>
          )}
        </>
      )}
      <Dialog open={open} onOpenChange={close}>
        <DialogContent className="w-[calc(100%-32px)] max-w-4xl max-h-[90dvh] overflow-auto rounded-xl p-5 sm:p-8">
          <DialogTitle className="text-2xl text-navy">
            Your signature
          </DialogTitle>
          <DialogDescription>
            Sign in the space below using your mouse, trackpad or finger. Your
            saved signature will be used on new prescriptions and sick notes you
            issue.
          </DialogDescription>
          {query.data?.signatureDataUrl && (
            <p className="text-sm text-muted-foreground">
              Leave the pad blank to keep your saved signature and only set or
              change its PIN.
            </p>
          )}
          <div className="grid gap-3 sm:grid-cols-3">
            {query.data?.pinConfigured && (
              <label className="text-sm">
                Current PIN
                <input
                  type="password"
                  inputMode="numeric"
                  autoComplete="off"
                  maxLength={6}
                  value={currentPin}
                  onChange={(e) =>
                    setCurrentPin(e.target.value.replace(/\D/g, ""))
                  }
                  className="mt-1 block w-full rounded-md border p-2"
                />
              </label>
            )}
            <label className="text-sm">
              New signature PIN
              <input
                type="password"
                inputMode="numeric"
                autoComplete="new-password"
                maxLength={6}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                className="mt-1 block w-full rounded-md border p-2"
              />
            </label>
            <label className="text-sm">
              Confirm PIN
              <input
                type="password"
                inputMode="numeric"
                autoComplete="new-password"
                maxLength={6}
                value={confirmPin}
                onChange={(e) =>
                  setConfirmPin(e.target.value.replace(/\D/g, ""))
                }
                className="mt-1 block w-full rounded-md border p-2"
              />
            </label>
          </div>
          <div className="relative overflow-hidden rounded-xl border bg-white">
            <canvas
              ref={canvas}
              width={1200}
              height={400}
              aria-label="Draw your signature"
              className="block w-full touch-none"
              style={{
                aspectRatio: "3 / 1",
                minHeight: 180,
                cursor: "crosshair",
              }}
              onPointerDown={(e) => {
                if (
                  busy ||
                  active.current !== null ||
                  (e.pointerType === "mouse" && e.button !== 0)
                )
                  return;
                e.preventDefault();
                if (!paths.current.length) {
                  const rect = e.currentTarget.getBoundingClientRect();
                  e.currentTarget.width = 1000;
                  e.currentTarget.height = Math.round(
                    (1000 * rect.height) / rect.width,
                  );
                }
                e.currentTarget.setPointerCapture(e.pointerId);
                active.current = e.pointerId;
                paths.current.push([point(e)]);
                changed.current = true;
                setError("");
                redraw();
              }}
              onPointerMove={(e) => {
                if (active.current !== e.pointerId || busy) return;
                paths.current[paths.current.length - 1].push(point(e));
                redraw();
              }}
              onPointerUp={(e) => {
                if (active.current === e.pointerId) {
                  active.current = null;
                  e.currentTarget.releasePointerCapture(e.pointerId);
                }
              }}
              onPointerCancel={() => {
                active.current = null;
              }}
              onLostPointerCapture={() => {
                active.current = null;
              }}
            />
            <div className="pointer-events-none absolute bottom-8 left-[8%] right-[8%] border-b border-dashed border-slate-300" />
          </div>
          <p className="text-xs text-muted-foreground">
            Draw above the guide. The guide will not appear on your documents.
          </p>
          {error && (
            <p role="alert" className="text-sm text-red-700">
              {error}
            </p>
          )}
          <div className="flex flex-wrap justify-between gap-3">
            <div className="flex gap-3">
              <ActionButton
                disabled={busy || !strokes.length}
                className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm"
                onClick={() => {
                  paths.current.pop();
                  changed.current = true;
                  redraw();
                }}
              >
                <RotateCcw size={15} />
                Undo
              </ActionButton>
              <ActionButton
                disabled={busy || !strokes.length}
                className="rounded-md border px-3 py-2 text-sm"
                onClick={() => {
                  paths.current = [];
                  changed.current = true;
                  redraw();
                }}
              >
                Clear
              </ActionButton>
            </div>
            <div className="flex gap-3">
              <ActionButton
                disabled={busy}
                className="rounded-md border px-4 py-2 text-sm"
                onClick={() => close(false)}
              >
                Cancel
              </ActionButton>
              <ActionButton
                disabled={
                  busy || (!strokes.length && !query.data?.signatureDataUrl)
                }
                className="rounded-md bg-[#ffcc53] px-5 py-2 text-sm font-semibold text-navy"
                onClick={save}
              >
                Save signature
              </ActionButton>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      {signing.dialog}
    </section>
  );
}
