import { createFileRoute } from "@/lib/router-compat";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/badge-pill";
import { Plus, X, Mail, UserX, UserCheck, Trash2 } from "lucide-react";
import {
  currentUser,
  inviteReceptionist,
  resendInvite,
  setUserStatus,
  softDeleteUser,
  tenantStaff,
  updateStaff,
  type User,
} from "@/lib/store";
import { format, parseISO } from "date-fns";

export const Route = createFileRoute("/staff")({ component: Staff });

function Staff() {
  const [, refresh] = useState(0);
  const reload = () => refresh((x) => x + 1);
  const me = currentUser();
  const staff = me?.tenantId ? tenantStaff(me.tenantId) : [];
  const [openAdd, setOpenAdd] = useState(false);
  const [manageId, setManageId] = useState<string | null>(null);
  const manage = staff.find((s) => s.id === manageId) || null;

  return (
    <AppShell title="Staff & roles">
      <div className="mb-5 flex items-end justify-between">
        <div>
          <div className="label-caps">My team</div>
          <h2 className="text-[22px] font-semibold text-navy">
            You have {staff.length} receptionist{staff.length === 1 ? "" : "s"}.
          </h2>
        </div>
        <button
          onClick={() => setOpenAdd(true)}
          className="inline-flex items-center gap-1.5 rounded-md bg-blue px-3.5 py-2 text-[13px] font-medium text-white hover:opacity-90"
        >
          <Plus className="h-4 w-4" /> Add receptionist
        </button>
      </div>

      {staff.length === 0 ? (
        <div className="pulse-card p-12 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-tint text-blue">
            <Plus className="h-6 w-6" />
          </div>
          <div className="text-[16px] font-semibold text-navy">
            No receptionists added yet
          </div>
          <p className="mx-auto mt-2 max-w-[360px] text-[13px] text-muted-foreground">
            Add a receptionist to help manage appointments and patient
            check-ins.
          </p>
          <button
            onClick={() => setOpenAdd(true)}
            className="mt-5 inline-flex items-center gap-1.5 rounded-md bg-blue px-4 py-2 text-[13px] font-medium text-white hover:opacity-90"
          >
            <Plus className="h-4 w-4" /> Add receptionist
          </button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {staff.map((s) => (
            <StaffCard key={s.id} u={s} onManage={() => setManageId(s.id)} />
          ))}
        </div>
      )}

      {openAdd && (
        <AddModal
          onClose={() => {
            setOpenAdd(false);
            reload();
          }}
        />
      )}
      {manage && (
        <ManageModal
          u={manage}
          onClose={() => {
            setManageId(null);
            reload();
          }}
        />
      )}
    </AppShell>
  );
}

function StaffCard({ u, onManage }: { u: User; onManage: () => void }) {
  const variant =
    u.status === "active"
      ? "success"
      : u.status === "invited"
        ? "warning"
        : "neutral";
  const initials =
    `${u.firstName[0] || ""}${u.lastName[0] || ""}`.toUpperCase();
  return (
    <div className="pulse-card p-5">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-tint text-[14px] font-semibold text-blue">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="truncate font-semibold text-navy">
            {u.firstName} {u.lastName}
          </div>
          <div className="text-[12px] text-muted-foreground capitalize">
            {u.status}
          </div>
        </div>
        <Badge variant={variant}>{u.status}</Badge>
      </div>
      <div className="mt-4 space-y-1 text-[12.5px] text-muted-foreground">
        <div className="truncate">{u.email}</div>
        {u.phone && <div className="font-mono">{u.phone}</div>}
        {u.inviteSentAt && (
          <div className="text-[11px]">
            Added {format(parseISO(u.inviteSentAt), "d MMM yyyy")}
          </div>
        )}
      </div>
      <button
        onClick={onManage}
        className="mt-4 w-full rounded-md border border-border bg-white px-3 py-2 text-[13px] font-medium text-navy hover:bg-surface"
      >
        Manage
      </button>
    </div>
  );
}

function AddModal({ onClose }: { onClose: () => void }) {
  const me = currentUser()!;
  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!first || !last || !email) {
      setError("Name and email are required.");
      return;
    }
    inviteReceptionist({ firstName: first, lastName: last, email, phone }, me);
    onClose();
  };

  return (
    <Modal title="Add receptionist" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <div className="grid gap-3 md:grid-cols-2">
          <Input label="First name" value={first} onChange={setFirst} />
          <Input label="Last name" value={last} onChange={setLast} />
        </div>
        <Input
          label="Email address"
          value={email}
          onChange={setEmail}
          type="email"
        />
        <Input label="Phone (optional)" value={phone} onChange={setPhone} />
        {error && (
          <div className="rounded-md bg-[#FEE2E2] px-3 py-2 text-[12.5px] text-[#991B1B]">
            {error}
          </div>
        )}
        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-4 py-2 text-[13px] text-muted-foreground hover:text-navy"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded-md bg-blue px-4 py-2 text-[13px] font-medium text-white hover:opacity-90"
          >
            Send invite
          </button>
        </div>
      </form>
    </Modal>
  );
}

function ManageModal({ u, onClose }: { u: User; onClose: () => void }) {
  const [editing, setEditing] = useState(false);
  const [first, setFirst] = useState(u.firstName);
  const [last, setLast] = useState(u.lastName);
  const [phone, setPhone] = useState(u.phone || "");

  const save = () => {
    updateStaff(u.id, { firstName: first, lastName: last, phone });
    setEditing(false);
    onClose();
  };
  const resend = () => {
    resendInvite(u.id);
    alert(`Invite resent to ${u.email}.`);
  };
  const deactivate = () => {
    if (
      confirm(
        `Deactivate ${u.firstName} ${u.lastName}? They will lose access immediately.`,
      )
    ) {
      setUserStatus(u.id, "inactive");
      onClose();
    }
  };
  const reactivate = () => {
    setUserStatus(u.id, "active");
    onClose();
  };
  const remove = () => {
    if (
      confirm(
        `Permanently remove ${u.firstName} ${u.lastName}? This cannot be undone.`,
      )
    ) {
      softDeleteUser(u.id);
      onClose();
    }
  };

  return (
    <Modal title={`${u.firstName} ${u.lastName}`} onClose={onClose}>
      <div className="space-y-4">
        {editing ? (
          <div className="space-y-3">
            <div className="grid gap-3 md:grid-cols-2">
              <Input label="First name" value={first} onChange={setFirst} />
              <Input label="Last name" value={last} onChange={setLast} />
            </div>
            <Input label="Phone" value={phone} onChange={setPhone} />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setEditing(false)}
                className="rounded-md px-3 py-1.5 text-[13px] text-muted-foreground"
              >
                Cancel
              </button>
              <button
                onClick={save}
                className="rounded-md bg-blue px-3 py-1.5 text-[13px] font-medium text-white"
              >
                Save
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-md border border-border bg-surface p-4 text-[13px]">
            <Row label="Email" value={u.email} />
            <Row label="Phone" value={u.phone || "—"} />
            <Row label="Status" value={u.status} />
          </div>
        )}

        <div className="grid gap-2">
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="rounded-md border border-border bg-white px-3 py-2 text-[13px] font-medium text-navy hover:bg-surface"
            >
              Edit details
            </button>
          )}
          {u.status === "invited" && (
            <button
              onClick={resend}
              className="inline-flex items-center justify-center gap-1.5 rounded-md border border-border bg-white px-3 py-2 text-[13px] font-medium text-navy hover:bg-surface"
            >
              <Mail className="h-4 w-4" /> Resend invite
            </button>
          )}
          {u.status === "active" && (
            <button
              onClick={deactivate}
              className="inline-flex items-center justify-center gap-1.5 rounded-md border border-border bg-white px-3 py-2 text-[13px] font-medium text-navy hover:bg-surface"
            >
              <UserX className="h-4 w-4" /> Deactivate
            </button>
          )}
          {u.status === "inactive" && (
            <button
              onClick={reactivate}
              className="inline-flex items-center justify-center gap-1.5 rounded-md border border-border bg-white px-3 py-2 text-[13px] font-medium text-navy hover:bg-surface"
            >
              <UserCheck className="h-4 w-4" /> Reactivate
            </button>
          )}
          <button
            onClick={remove}
            className="mt-2 inline-flex items-center justify-center gap-1.5 rounded-md border border-[#FEE2E2] bg-[#FEF2F2] px-3 py-2 text-[13px] font-medium text-[#991B1B] hover:bg-[#FEE2E2]"
          >
            <Trash2 className="h-4 w-4" /> Remove permanently
          </button>
        </div>
      </div>
    </Modal>
  );
}

function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-[480px] rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <h3 className="text-[15px] font-semibold text-navy">{title}</h3>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-navy"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-1">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-navy capitalize">{value}</span>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="text-[12.5px] font-medium text-navy">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1.5 block w-full rounded-md border border-border bg-white px-3 py-2.5 text-[13.5px] outline-none focus:border-blue"
      />
    </label>
  );
}
