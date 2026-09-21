import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link, useParams } from "@/lib/router-compat";
import { useQueryClient } from "@tanstack/react-query";
import { Clock, Save, CheckCircle } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { ActionButton } from "@/components/action-feedback";
import { VoiceNotes } from "@/components/voice-notes";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import API, { getApiErrorMessage } from "@/utils/api";
import "./consultation.css";

export const Route = createFileRoute("/appointments/$id/consultation")({
  component: ConsultationRoute,
});
function ConsultationRoute() {
  const { id } = useParams<{ id: string }>();
  return <Consultation key={id} id={id} />;
}
type Content = {
  history: string;
  examination: string;
  assessment: string;
  plan: string;
  transcript: string;
};
type Session = Content & {
  revision: number;
  startedAt: string;
  endedAt: string | null;
  savedAt: string;
};
type Data = {
  appointment: {
    id: string;
    patientName: string;
    patientId: string;
    reason: string;
    status: string;
  };
  consultation: Session | null;
};
const empty: Content = {
  history: "",
  examination: "",
  assessment: "",
  plan: "",
  transcript: "",
};
const fields = ["history", "examination", "assessment", "plan"] as const;
const labels = {
  history: "History / subjective",
  examination: "Examination / objective",
  assessment: "Assessment",
  plan: "Plan & follow-up",
};
function content(session: Session): Content {
  return Object.fromEntries(
    [...fields, "transcript"].map((k) => [
      k,
      session[k as keyof Content] || "",
    ]),
  ) as Content;
}
function Consultation({ id }: { id: string }) {
  const cache = useQueryClient();
  const [data, setData] = useState<Data | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [notes, setNotes] = useState<Content>(empty);
  const [saved, setSaved] = useState("");
  const [error, setError] = useState("");
  const [now, setNow] = useState(Date.now());
  const [busy, setBusy] = useState(false);
  const [recording, setRecording] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [loading, setLoading] = useState(true);
  const dirty = session && JSON.stringify(notes) !== saved;
  const guarded = useRef(false);
  guarded.current = Boolean(dirty || recording);
  useEffect(() => {
    let live = true;
    API.get<Data>(`/appointments/${id}/consultation`)
      .then(({ data }) => {
        if (!live) return;
        setData(data);
        setSession(data.consultation);
        if (data.consultation) {
          const n = content(data.consultation);
          setNotes(n);
          setSaved(JSON.stringify(n));
        }
      })
      .catch((e) => live && setError(getApiErrorMessage(e)))
      .finally(() => live && setLoading(false));
    return () => {
      live = false;
    };
  }, [id]);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    const leave = (event: BeforeUnloadEvent) => {
      if (guarded.current) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    const link = (event: MouseEvent) => {
      if (!guarded.current) return;
      const target =
        event.target instanceof Element
          ? event.target.closest("a[href]")
          : null;
      if (
        target &&
        !target.hasAttribute("download") &&
        !window.confirm(
          "Leave this consultation? Unsaved text and audio will be lost, and recording will stop.",
        )
      ) {
        event.preventDefault();
        event.stopPropagation();
      }
    };
    window.addEventListener("beforeunload", leave);
    document.addEventListener("click", link, true);
    return () => {
      window.removeEventListener("beforeunload", leave);
      document.removeEventListener("click", link, true);
    };
  }, []);
  const accept = (s: Session) => {
    setSession(s);
    const n = content(s);
    setNotes(n);
    setSaved(JSON.stringify(n));
    setError("");
  };
  const start = async () => {
    setBusy(true);
    try {
      accept(
        (await API.post<Session>(`/appointments/${id}/consultation/start`))
          .data,
      );
      await cache.invalidateQueries({ queryKey: ["appointments"] });
    } catch (e) {
      setError(getApiErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };
  const save = async (complete = false) => {
    if (!session) return;
    setBusy(true);
    setError("");
    try {
      const payload = { ...notes, revision: session.revision };
      const response = complete
        ? await API.post<Session>(
            `/appointments/${id}/consultation/complete`,
            payload,
          )
        : await API.put<Session>(`/appointments/${id}/consultation`, payload);
      accept(response.data);
      setConfirm(false);
      if (complete)
        await cache.invalidateQueries({ queryKey: ["appointments"] });
    } catch (e) {
      setError(getApiErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };
  const elapsed = session
    ? Math.max(
        0,
        Math.floor(
          ((session.endedAt ? Date.parse(session.endedAt) : now) -
            Date.parse(session.startedAt)) /
            1000,
        ),
      )
    : 0;
  const timer = `${Math.floor(elapsed / 3600)
    .toString()
    .padStart(2, "0")}:${Math.floor((elapsed / 60) % 60)
    .toString()
    .padStart(2, "0")}:${(elapsed % 60).toString().padStart(2, "0")}`;
  const locked = busy || Boolean(session?.endedAt);
  return (
    <AppShell title="Clinical consultation">
      <div className="consult-page">
        {loading ? (
          <p role="status">Loading consultation…</p>
        ) : (
          <>
            {error && (
              <div className="consult-error" role="alert">
                {error}
              </div>
            )}
            {data && (
              <>
                <header className="consult-header">
                  <div>
                    <p className="gp-eyebrow">PATIENT CONSULTATION</p>
                    <h2>{data.appointment.patientName}</h2>
                    <p>{data.appointment.reason}</p>
                    <Link
                      to={`/patients/${data.appointment.patientId}`}
                      className="gp-inline-link"
                    >
                      Open patient record
                    </Link>
                  </div>
                  <div className="consult-clock">
                    <Clock size={19} />
                    <strong aria-label="Consultation elapsed time">
                      {timer}
                    </strong>
                    <span>
                      {session?.endedAt
                        ? "Completed"
                        : session
                          ? "Consultation in progress"
                          : "Not started"}
                    </span>
                  </div>
                </header>
                {!session ? (
                  <div className="pulse-card p-8">
                    <h3 className="text-lg font-semibold">Ready to begin?</h3>
                    <p className="my-3 text-sm text-muted-foreground">
                      Starting records the consultation time and marks the
                      appointment as in progress.
                    </p>
                    <ActionButton
                      className="gp-button gp-button-yellow"
                      disabled={
                        busy ||
                        ["Completed", "Cancelled", "No-show"].includes(
                          data.appointment.status,
                        )
                      }
                      onClick={start}
                    >
                      Start appointment
                    </ActionButton>
                  </div>
                ) : (
                  <>
                    <div className="consult-savebar">
                      <span role="status">
                        {busy
                          ? "Saving…"
                          : dirty
                            ? "Unsaved changes"
                            : `Saved ${new Date(session.savedAt).toLocaleTimeString("en-ZA")}`}
                      </span>
                      <div className="flex flex-wrap gap-3">
                        <ActionButton
                          className="gp-button"
                          disabled={locked || recording || !dirty}
                          onClick={() => save()}
                        >
                          <Save size={15} /> Save notes
                        </ActionButton>
                        <ActionButton
                          className="gp-button gp-button-yellow"
                          disabled={locked || recording}
                          onClick={() => setConfirm(true)}
                        >
                          <CheckCircle size={15} /> Complete appointment
                        </ActionButton>
                      </div>
                    </div>
                    {session.endedAt && (
                      <p className="consult-completed">
                        Consultation completed. Saved notes are read-only.
                      </p>
                    )}
                    <div className="consult-columns">
                      <section className="consult-notes">
                        {fields.map((field) => (
                          <label key={field}>
                            {labels[field]}
                            <textarea
                              rows={6}
                              value={notes[field]}
                              maxLength={30000}
                              disabled={locked}
                              onChange={(e) =>
                                setNotes((n) => ({
                                  ...n,
                                  [field]: e.target.value,
                                }))
                              }
                              placeholder={`Type ${field} notes, or insert a reviewed voice transcript.`}
                            />
                          </label>
                        ))}
                      </section>
                      <VoiceNotes
                        patientId={data.appointment.patientId}
                        appointmentId={id}
                        value={notes.transcript}
                        disabled={locked}
                        onRecording={setRecording}
                        onChange={(transcript) =>
                          setNotes((n) => ({ ...n, transcript }))
                        }
                        onAppend={(text) =>
                          setNotes((n) => ({
                            ...n,
                            transcript: [n.transcript, text]
                              .filter(Boolean)
                              .join("\n"),
                          }))
                        }
                        onInsert={(section) =>
                          setNotes((n) => ({
                            ...n,
                            [section]: [
                              n[section as keyof Content],
                              n.transcript,
                            ]
                              .filter(Boolean)
                              .join("\n\n"),
                            transcript: "",
                          }))
                        }
                      />
                    </div>
                    <Dialog open={confirm} onOpenChange={setConfirm}>
                      <DialogContent>
                        <DialogTitle>Complete consultation?</DialogTitle>
                        <DialogDescription>
                          This saves the current notes, stops the timer and
                          marks the appointment complete. Review clinical
                          details first; completed notes are read-only.
                        </DialogDescription>
                        <ActionButton
                          className="gp-button gp-button-yellow"
                          disabled={busy}
                          onClick={() => save(true)}
                        >
                          Save & complete
                        </ActionButton>
                      </DialogContent>
                    </Dialog>
                  </>
                )}
              </>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}
