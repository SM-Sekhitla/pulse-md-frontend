import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Mic, Square } from "lucide-react";
import { ActionButton } from "@/components/action-feedback";
import {
  PatientDocuments,
  uploadPatientFile,
} from "@/components/patient-documents";
import { getApiErrorMessage } from "@/utils/api";

export function ConsultationRecorder({
  patientId,
  appointmentId,
  disabled,
  onRecording,
}: {
  patientId: string;
  appointmentId: string;
  disabled: boolean;
  onRecording: (active: boolean) => void;
}) {
  const recorder = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const mounted = useRef(true);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [active, setActive] = useState(false);
  const [pending, setPending] = useState(false);
  const [permission, setPermission] = useState(false);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const client = useQueryClient();
  const callback = useRef(onRecording);
  callback.current = onRecording;
  useEffect(() => {
    callback.current(active || pending || Boolean(blob && !saved));
  }, [active, pending, blob, saved]);
  useEffect(() => {
    if (!blob) {
      setUrl("");
      return;
    }
    const next = URL.createObjectURL(blob);
    setUrl(next);
    return () => URL.revokeObjectURL(next);
  }, [blob]);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      if (timer.current) clearTimeout(timer.current);
      if (recorder.current) {
        recorder.current.onstop = null;
        recorder.current.ondataavailable = null;
        if (recorder.current.state !== "inactive") recorder.current.stop();
      }
      stream.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);
  const supported = Boolean(
    typeof navigator.mediaDevices?.getUserMedia === "function" &&
    typeof window.MediaRecorder === "function",
  );
  async function start() {
    setError("");
    setPending(true);
    setSaved(false);
    try {
      const media = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (!mounted.current) {
        media.getTracks().forEach((t) => t.stop());
        return;
      }
      stream.current = media;
      const mimeType = [
        "audio/webm;codecs=opus",
        "audio/mp4",
        "audio/ogg;codecs=opus",
      ].find((type) => MediaRecorder.isTypeSupported(type));
      if (!mimeType)
        throw new Error(
          "This browser cannot record a supported audio format. Try a current Chrome, Edge or Safari browser.",
        );
      const next = new MediaRecorder(media, {
        mimeType,
        audioBitsPerSecond: 64000,
      });
      recorder.current = next;
      const chunks: Blob[] = [];
      let size = 0;
      next.ondataavailable = (e) => {
        if (e.data.size) {
          chunks.push(e.data);
          size += e.data.size;
          if (size >= 9 * 1024 * 1024 && next.state !== "inactive") next.stop();
        }
      };
      next.onerror = () => {
        setError(
          "Recording was interrupted. Review any captured audio before saving.",
        );
        if (next.state !== "inactive") next.stop();
      };
      next.onstop = () => {
        media.getTracks().forEach((t) => t.stop());
        if (timer.current) clearTimeout(timer.current);
        if (!mounted.current) return;
        setActive(false);
        const result = new Blob(chunks, { type: mimeType });
        if (result.size) setBlob(result);
        else
          setError(
            "No audio was captured. Check your microphone and try again.",
          );
      };
      next.start(1000);
      setBlob(null);
      setActive(true);
      timer.current = setTimeout(
        () => {
          if (next.state !== "inactive") next.stop();
        },
        15 * 60 * 1000,
      );
    } catch (e) {
      stream.current?.getTracks().forEach((t) => t.stop());
      setError(
        e instanceof DOMException && e.name === "NotAllowedError"
          ? "Microphone access was denied. Allow the microphone for this site in your browser settings, then try again."
          : getApiErrorMessage(e),
      );
    } finally {
      if (mounted.current) setPending(false);
    }
  }
  async function save() {
    if (!blob) return;
    setError("");
    setPending(true);
    try {
      const extension = blob.type.includes("mp4")
        ? "m4a"
        : blob.type.includes("ogg")
          ? "ogg"
          : "webm";
      await uploadPatientFile(
        patientId,
        new File(
          [blob],
          `Consultation-${new Date().toISOString().replace(/[:.]/g, "-")}.${extension}`,
          { type: blob.type },
        ),
        appointmentId,
      );
      setSaved(true);
      await client.invalidateQueries({
        queryKey: ["patient-documents", patientId],
      });
    } catch (e) {
      setError(getApiErrorMessage(e));
    } finally {
      setPending(false);
    }
  }
  return (
    <div className="space-y-3 mb-6">
      <h3 className="font-semibold">Audio recording</h3>
      <p className="text-sm">
        Record up to 15 minutes per clip. Stop, listen, then save the recording
        to this appointment.
      </p>
      {!supported && (
        <p role="alert">
          Audio recording requires microphone support and HTTPS (or localhost).
        </p>
      )}
      <label className="consult-consent">
        <input
          type="checkbox"
          checked={permission}
          disabled={active || pending || disabled}
          onChange={(e) => setPermission(e.target.checked)}
        />
        I have permission to record and save this consultation.
      </label>
      <ActionButton
        className="gp-button gp-button-yellow"
        disabled={
          pending ||
          (!active &&
            (disabled || !supported || !permission || Boolean(blob && !saved)))
        }
        onClick={() => (active ? recorder.current?.stop() : start())}
      >
        {active ? <Square size={15} /> : <Mic size={15} />}
        {active ? "Stop recording" : pending ? "Please wait…" : "Record audio"}
      </ActionButton>
      {active && (
        <p role="status" className="text-red-700">
          ● Recording audio…
        </p>
      )}
      {url && (
        <>
          <audio className="w-full" controls src={url} />
          <div className="flex flex-wrap gap-2">
            <ActionButton
              className="gp-button"
              disabled={disabled || pending || saved}
              onClick={save}
            >
              {saved ? "Recording saved" : "Save recording"}
            </ActionButton>
            {!saved && (
              <ActionButton
                className="gp-button"
                disabled={pending}
                onClick={() => {
                  if (window.confirm("Discard this unsaved recording?"))
                    setBlob(null);
                }}
              >
                Discard
              </ActionButton>
            )}
            <a
              href={url}
              download="consultation-recording"
              className="gp-button"
            >
              Download copy
            </a>
          </div>
          {!saved && <p role="status">Recording has not been saved yet.</p>}
        </>
      )}
      {error && (
        <p role="alert" className="text-red-700">
          {error}
        </p>
      )}
      <PatientDocuments
        patientId={patientId}
        appointmentId={appointmentId}
        recordingsOnly
      />
    </div>
  );
}
