import { useEffect, useState } from "react";
import { ClaimDraftEditor } from "@/components/claim-draft-editor";
import { useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@/lib/router-compat";
import {
  ClipboardCheck,
  Plus,
  Search,
  ArrowUpRight,
  RefreshCw,
  CircleAlert,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { ActionButton, ActionForm } from "@/components/action-feedback";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { SearchableSelect } from "@/components/searchable-select";
import { useData } from "@/context/AppDataProvider";
import { useAuth } from "@/context/AuthContext";
import { useModuleAccess } from "@/hooks/use-module-access";
import { claimsService, type Claim } from "@/services/claims";
import { formatZAR } from "@/lib/pricing";
import { getApiErrorMessage } from "@/utils/api";
import { toast } from "sonner";
import "./claims.css";

export const Route = createFileRoute("/claims")({ component: Claims });
const labels = {
  draft: "Draft",
  needs_attention: "Needs attention",
  prepared: "Locally validated",
};
const amount = (cents: number) => formatZAR(cents / 100);
const dateLabel = (value: string) =>
  value ? new Date(value).toLocaleDateString("en-ZA") : "Not recorded";
function Claims() {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const hasBilling = useModuleAccess("billing");
  const allowed = hasBilling && ["owner", "manager"].includes(user?.role || "");
  const { invoice } = useData();
  const cache = useQueryClient();
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string | null>(null);
  const [creating, setCreating] = useState(
    Boolean(searchParams.get("invoiceId")),
  );
  const [invoiceId, setInvoiceId] = useState(
    searchParams.get("invoiceId") || "",
  );
  const [note, setNote] = useState("");
  const [editing, setEditing] = useState(false);
  const [reloadOpen, setReloadOpen] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => {
      setQuery(search);
      setPage(1);
    }, 250);
    return () => clearTimeout(timer);
  }, [search]);
  useEffect(() => setNote(""), [selected]);
  const list = useQuery({
    queryKey: ["claims", user?.tenantId, query, status, page],
    queryFn: ({ signal }) => claimsService.list(query, status, page, signal),
    enabled: allowed,
  });
  const detail = useQuery({
    queryKey: ["claim", user?.tenantId, selected],
    queryFn: () => claimsService.detail(selected!),
    enabled: allowed && Boolean(selected),
  });
  const claim = detail.data;
  const eligible = invoice.invoices.filter(
    (item) =>
      item.billingType === "medical_aid" &&
      !["Paid", "Void"].includes(item.status) &&
      (item.claimStatus || "not_submitted") === "not_submitted",
  );
  const refresh = async (saved?: Claim) => {
    if (saved) cache.setQueryData(["claim", user?.tenantId, saved.id], saved);
    await cache.invalidateQueries({ queryKey: ["claims", user?.tenantId] });
  };
  return (
    <AppShell title="Claims management">
      <div className="claims-workspace">
        {!allowed ? (
          <div className="pulse-card p-6">
            Claims preparation is available to practice owners and managers with
            Billing enabled.
          </div>
        ) : (
          <>
            <section className="claims-intro">
              <div>
                <p className="gp-eyebrow">FINANCE / CLAIMS</p>
                <h2>Every claim, accounted for.</h2>
                <p>
                  Prepare claims from your invoices and identify issues before
                  submission.
                </p>
              </div>
              <ActionButton
                className="gp-button gp-button-yellow"
                onClick={() => setCreating(true)}
              >
                <Plus size={16} /> Prepare claim
              </ActionButton>
            </section>
            <div className="claims-connection">
              <CircleAlert size={19} />
              <div>
                <strong>SwitchOn not configured</strong>
                <p>
                  You can prepare and check drafts. Live submission, membership
                  validation and remittance reconciliation are not available
                  yet.
                </p>
              </div>
              <span>PREPARATION ONLY</span>
            </div>
            <section className="pulse-card">
              <div className="claims-toolbar">
                <div className="claims-search">
                  <Search size={16} />
                  <input
                    aria-label="Search claims"
                    placeholder="Patient, claim, invoice or scheme…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <label className="sr-only" htmlFor="claim-status">
                  Claim status
                </label>
                <select
                  id="claim-status"
                  value={status}
                  onChange={(e) => {
                    setStatus(e.target.value);
                    setPage(1);
                  }}
                >
                  <option value="">All preparation statuses</option>
                  {Object.entries(labels).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
                <ActionButton
                  aria-label="Refresh claims"
                  onClick={async () => {
                    await list.refetch();
                  }}
                >
                  <RefreshCw size={17} />
                </ActionButton>
              </div>
              {list.isPending ? (
                <div className="claims-empty" role="status">
                  Loading claims…
                </div>
              ) : list.isError ? (
                <div className="claims-empty" role="alert">
                  <p>{getApiErrorMessage(list.error)}</p>
                  <ActionButton
                    className="gp-button"
                    onClick={async () => {
                      await list.refetch();
                    }}
                  >
                    Try again
                  </ActionButton>
                </div>
              ) : !list.data?.items.length ? (
                <div className="claims-empty">
                  <ClipboardCheck size={34} />
                  <h3>
                    {search || status
                      ? "No matching claims"
                      : "Your claims workspace is ready"}
                  </h3>
                  <p>
                    {search || status
                      ? "Try another search or status filter."
                      : "Start with an unpaid medical aid invoice. Preparing a claim does not submit it or change the invoice balance."}
                  </p>
                  <Link to="/billing" className="gp-inline-link">
                    View billing <ArrowUpRight size={15} />
                  </Link>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table>
                      <thead>
                        <tr>
                          {[
                            "Patient / claim",
                            "Scheme",
                            "Invoice",
                            "Service date",
                            "Billed",
                            "Preparation",
                            "Delivery",
                          ].map((label) => (
                            <th key={label}>{label}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {list.data.items.map((item) => (
                          <tr key={item.id}>
                            <td>
                              <ActionButton
                                className="claims-open"
                                onClick={() => setSelected(item.id)}
                              >
                                <strong>{item.patientName}</strong>
                                <small>{item.reference}</small>
                              </ActionButton>
                            </td>
                            <td>{item.schemeName || "Not selected"}</td>
                            <td>{item.invoiceNumber}</td>
                            <td>{dateLabel(item.dateOfService)}</td>
                            <td>{amount(item.billedCents)}</td>
                            <td>
                              <span className={`claims-status ${item.status}`}>
                                {labels[item.status]}
                              </span>
                            </td>
                            <td>Not sent</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="claims-pagination">
                    <span>
                      {list.data.total} claims · Page {page} of{" "}
                      {Math.max(1, Math.ceil(list.data.total / 25))}
                    </span>
                    <div>
                      <ActionButton
                        disabled={page === 1}
                        onClick={() => setPage((p) => p - 1)}
                      >
                        Previous
                      </ActionButton>
                      <ActionButton
                        disabled={page * 25 >= list.data.total}
                        onClick={() => setPage((p) => p + 1)}
                      >
                        Next
                      </ActionButton>
                    </div>
                  </div>
                </>
              )}
            </section>
            <p className="claims-footnote">
              Claim totals represent invoice charges. They do not establish
              scheme cover, payment received, or patient responsibility.
            </p>
            <Dialog open={creating} onOpenChange={setCreating}>
              <DialogContent>
                <DialogTitle>Prepare a claim</DialogTitle>
                <DialogDescription>
                  Choose an unpaid medical aid invoice. If a draft already
                  exists, it will open without creating a duplicate.
                </DialogDescription>
                <ActionForm
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!invoiceId) return;
                    const saved = await claimsService.create(invoiceId);
                    await refresh(saved);
                    setSelected(saved.id);
                    setCreating(false);
                    setInvoiceId("");
                    toast.success("Claim draft opened");
                  }}
                  className="space-y-5"
                >
                  <SearchableSelect
                    label="Select medical aid invoice"
                    value={invoiceId}
                    onChange={setInvoiceId}
                    className="w-full"
                    options={eligible.map((item) => ({
                      value: item.id,
                      label: `${item.number} · ${item.patientName} · ${formatZAR(item.amount)}`,
                    }))}
                  />
                  {!eligible.length && (
                    <p className="text-sm text-muted-foreground">
                      No eligible invoices. Create a medical aid invoice in
                      Billing first.
                    </p>
                  )}
                  <ActionButton
                    type="submit"
                    disabled={!invoiceId}
                    className="gp-button gp-button-yellow"
                  >
                    Prepare draft
                  </ActionButton>
                </ActionForm>
              </DialogContent>
            </Dialog>
            <Sheet
              open={Boolean(selected)}
              onOpenChange={(open) => {
                if (!open) {
                  if (
                    editing &&
                    !window.confirm("Discard unsaved draft corrections?")
                  )
                    return;
                  setEditing(false);
                  setSelected(null);
                }
              }}
            >
              <SheetContent className="claims-detail overflow-y-auto w-full sm:max-w-[760px]">
                <SheetTitle>{claim?.reference || "Claim details"}</SheetTitle>
                <SheetDescription>
                  Review the invoice snapshot, preparation checks and activity.
                </SheetDescription>
                {detail.isPending ? (
                  <p role="status" className="py-6">
                    Loading claim…
                  </p>
                ) : detail.isError ? (
                  <div role="alert" className="py-6">
                    {getApiErrorMessage(detail.error)}
                    <ActionButton
                      onClick={async () => {
                        await detail.refetch();
                      }}
                    >
                      Reload claim
                    </ActionButton>
                  </div>
                ) : (
                  claim && (
                    <>
                      <div className="claims-detail-heading">
                        <h2>{claim.patientName}</h2>
                        <span className={`claims-status ${claim.status}`}>
                          {labels[claim.status]}
                        </span>
                      </div>
                      <div className="claims-facts">
                        <div>
                          <small>Medical aid</small>
                          <strong>{claim.schemeName || "Not selected"}</strong>
                        </div>
                        <div>
                          <small>Member / dependant</small>
                          <strong>
                            {claim.memberNumber || "Missing"} /{" "}
                            {claim.dependantCode || "Not recorded"}
                          </strong>
                        </div>
                        <div>
                          <small>Invoice</small>
                          <strong>{claim.invoiceNumber}</strong>
                        </div>
                        <div>
                          <small>Service date</small>
                          <strong>{dateLabel(claim.dateOfService)}</strong>
                        </div>
                      </div>
                      <div className="claims-checks">
                        <h3>Preparation checks</h3>
                        {claim.validationErrors.length ? (
                          <ul>
                            {claim.validationErrors.map((message) => (
                              <li key={message}>{message}</li>
                            ))}
                          </ul>
                        ) : (
                          <p>
                            {claim.status === "prepared"
                              ? "Local checks passed. Provider setup and switch-specific checks are still required before live submission."
                              : "Run validation to check the saved draft."}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-3 mt-4">
                          <ActionButton
                            disabled={editing}
                            className="gp-button gp-button-yellow"
                            onClick={async () => {
                              const saved = await claimsService.validate(claim);
                              await refresh(saved);
                              toast.success(
                                saved.validationErrors.length
                                  ? "Validation completed with issues"
                                  : "Local validation passed",
                              );
                            }}
                          >
                            Validate draft
                          </ActionButton>
                          {user?.role === "owner" && (
                            <ActionButton
                              disabled={editing}
                              className="gp-button"
                              onClick={() => setEditing(true)}
                            >
                              Correct draft
                            </ActionButton>
                          )}
                          <ActionButton
                            disabled={editing}
                            className="gp-button"
                            onClick={() => setReloadOpen(true)}
                          >
                            Reload from invoice
                          </ActionButton>
                          <Link
                            to={`/billing?invoiceId=${claim.invoiceId}`}
                            className="gp-button"
                          >
                            Open invoice
                          </Link>
                        </div>
                      </div>
                      {editing && (
                        <ClaimDraftEditor
                          key={claim.id}
                          claim={claim}
                          onCancel={() => setEditing(false)}
                          onSaved={async (saved) => {
                            await refresh(saved);
                            setEditing(false);
                            toast.success(
                              "Corrections saved. Validate the draft before continuing.",
                            );
                          }}
                        />
                      )}
                      <h3 className="mt-6 font-semibold">Diagnosis codes</h3>
                      <p className="text-sm mt-2">
                        {claim.diagnoses
                          .map((d) => `${d.code} — ${d.description}`)
                          .join("; ") || "No diagnoses recorded"}
                      </p>
                      <div className="overflow-x-auto mt-5">
                        <table className="w-full text-sm">
                          <thead>
                            <tr>
                              <th>Tariff / description</th>
                              <th>Qty</th>
                              <th>Diagnoses</th>
                              <th>Amount</th>
                            </tr>
                          </thead>
                          <tbody>
                            {claim.lines.map((line, i) => (
                              <tr key={i}>
                                <td>
                                  {line.code} · {line.description}
                                </td>
                                <td>{line.quantity}</td>
                                <td>
                                  {line.diagnosisCodes?.join(", ") ||
                                    "Not linked"}
                                </td>
                                <td>{amount(line.amountCents)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div className="claims-total">
                        <span>Total billed</span>
                        <strong>{amount(claim.billedCents)}</strong>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Not sent to SwitchOn · Not assessed · No payment
                        recorded by this module
                      </p>
                      <h3 className="mt-7 font-semibold">Activity</h3>
                      <ol className="claims-timeline">
                        {claim.events.map((event, i) => (
                          <li key={i}>
                            <p>{event.description}</p>
                            <time>
                              {new Date(event.createdAt).toLocaleString(
                                "en-ZA",
                              )}
                            </time>
                          </li>
                        ))}
                      </ol>
                      <ActionForm
                        className="space-y-3"
                        onSubmit={async (e) => {
                          e.preventDefault();
                          const saved = await claimsService.note(claim, note);
                          await refresh(saved);
                          setNote("");
                          toast.success("Note added");
                        }}
                      >
                        <label
                          htmlFor="claim-note"
                          className="text-sm font-medium"
                        >
                          Internal note
                        </label>
                        <textarea
                          id="claim-note"
                          value={note}
                          onChange={(e) => setNote(e.target.value)}
                          maxLength={2000}
                          rows={3}
                          required
                          className="w-full rounded-md border p-3 text-sm"
                        />
                        <ActionButton
                          type="submit"
                          disabled={!note.trim() || editing}
                          className="gp-button"
                        >
                          Add note
                        </ActionButton>
                      </ActionForm>
                    </>
                  )
                )}
              </SheetContent>
            </Sheet>
            <Dialog open={reloadOpen} onOpenChange={setReloadOpen}>
              <DialogContent>
                <DialogTitle>Replace draft with invoice details?</DialogTitle>
                <DialogDescription>
                  This replaces membership details, service date, diagnoses and
                  tariff lines with the current invoice. Your draft corrections
                  and line diagnosis links will be reset. Activity history is
                  kept.
                </DialogDescription>
                <div className="flex gap-3">
                  <ActionButton
                    className="gp-button"
                    onClick={() => setReloadOpen(false)}
                  >
                    Keep draft
                  </ActionButton>
                  <ActionButton
                    className="gp-button gp-button-yellow"
                    onClick={async () => {
                      if (!claim) return;
                      const saved = await claimsService.refreshInvoice(claim);
                      await refresh(saved);
                      setReloadOpen(false);
                      toast.success(
                        "Invoice reloaded. Review diagnosis links and validate again.",
                      );
                    }}
                  >
                    Replace draft
                  </ActionButton>
                </div>
              </DialogContent>
            </Dialog>
          </>
        )}
      </div>
    </AppShell>
  );
}
