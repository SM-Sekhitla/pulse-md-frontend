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
  const query = useQuery({
    queryKey: ["signature-template"],
    queryFn: async () =>
      (
        await API.get<{
          signatureDataUrl: string | null;
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
  }
  function begin() {
    paths.current = [];
    setStrokes([]);
    changed.current = false;
    setError("");
    active.current = null;
    setOpen(true);
  }
  async function save() {
    if (active.current !== null) return;
    if (!canvas.current || !paths.current.some((p) => p.length > 4)) {
      setError("Draw your signature before saving.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await API.put("/signature-template", {
        signatureDataUrl: canvas.current.toDataURL("image/png"),
      });
      await cache.invalidateQueries({ queryKey: ["signature-template"] });
      changed.current = false;
      setOpen(false);
      toast.success(
        "Signature template saved. New documents will use this signature.",
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
      await API.delete("/signature-template");
      await cache.invalidateQueries({ queryKey: ["signature-template"] });
      toast.success("Signature template removed.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="md:col-span-2 max-w-3xl">
      <p className="text-sm text-muted-foreground mb-5">
        Create your reusable handwritten signature. It will appear above your
        name on new prescriptions and sick notes you issue. Updating it does not
        change previously issued documents.
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
                ? "Click to draw a replacement signature"
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
                disabled={busy || !strokes.length}
                className="rounded-md bg-[#ffcc53] px-5 py-2 text-sm font-semibold text-navy"
                onClick={save}
              >
                Save signature
              </ActionButton>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
