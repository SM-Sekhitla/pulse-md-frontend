import { ConsultationRecorder } from "@/components/consultation-recorder";
import { useEffect, useRef, useState } from "react";
import { Mic, Square } from "lucide-react";
import { ActionButton } from "@/components/action-feedback";

type Recognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult:
    | ((event: {
        resultIndex: number;
        results: {
          length: number;
          [index: number]: { isFinal: boolean; 0: { transcript: string } };
        };
      }) => void)
    | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
};
const recognitionConstructor = () => {
  const speechWindow = window as unknown as {
    SpeechRecognition?: new () => Recognition;
    webkitSpeechRecognition?: new () => Recognition;
  };
  return speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition;
};
export function VoiceNotes({
  patientId,
  appointmentId,
  value,
  onChange,
  onAppend,
  onRecording,
  disabled,
  onInsert,
}: {
  patientId: string;
  appointmentId: string;
  value: string;
  onChange: (text: string) => void;
  onAppend: (text: string) => void;
  onRecording: (active: boolean) => void;
  disabled: boolean;
  onInsert: (section: string) => void;
}) {
  const ref = useRef<Recognition | null>(null);
  const stoppedByUser = useRef(false);
  const startupTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [starting, setStarting] = useState(false);
  const appendRef = useRef(onAppend);
  appendRef.current = onAppend;
  const [active, setActive] = useState(false);
  const [audioBusy, setAudioBusy] = useState(false);
  useEffect(() => {
    onRecording(active || starting || audioBusy);
  }, [active, starting, audioBusy, onRecording]);
  const [permission, setPermission] = useState(false);
  const [interim, setInterim] = useState("");
  const [error, setError] = useState("");
  const [section, setSection] = useState("history");
  const supported = Boolean(recognitionConstructor());
  useEffect(
    () => () => {
      if (startupTimer.current) clearTimeout(startupTimer.current);
      if (ref.current) {
        ref.current.onresult = null;
        ref.current.onend = null;
        ref.current.onerror = null;
        ref.current.abort();
      }
    },
    [],
  );
  const start = () => {
    const Constructor = recognitionConstructor();
    if (!Constructor || starting || active || audioBusy) return;
    stoppedByUser.current = false;
    setError("");
    const recognition = new Constructor();
    ref.current = recognition;
    recognition.lang = "en-ZA";
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.onresult = (event) => {
      let final = "";
      let partial = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal)
          final += event.results[i][0].transcript + " ";
        else partial += event.results[i][0].transcript;
      }
      if (final.trim()) appendRef.current(final.trim());
      setInterim(partial);
    };
    recognition.onerror = (event) => {
      if (startupTimer.current) clearTimeout(startupTimer.current);
      setError(
        event.error === "not-allowed"
          ? "Microphone access was denied. Allow microphone access for this site in your browser settings."
          : event.error === "network" || event.error === "service-not-allowed"
            ? "The browser could not connect to its speech-to-text service. Microphone permission alone cannot fix this; a configured transcription service is needed. Your existing transcript is retained."
            : event.error === "audio-capture"
              ? "No microphone could be opened. Check your input device and close other apps using it."
              : event.error === "no-speech"
                ? "No speech was detected. Check your microphone input and try again."
                : `Dictation stopped (${event.error}). Your existing transcript is retained.`,
      );
      setStarting(false);
      setActive(false);
      recognition.onerror = null;
      recognition.abort();
    };
    recognition.onstart = () => {
      if (startupTimer.current) clearTimeout(startupTimer.current);
      setStarting(false);
      setActive(true);
    };
    recognition.onend = () => {
      if (startupTimer.current) clearTimeout(startupTimer.current);
      setActive(false);
      setStarting(false);
      setInterim("");
      if (!stoppedByUser.current) {
        setError(
          (current) =>
            current ||
            "The browser ended dictation unexpectedly. Your transcript is retained. A dedicated transcription service is recommended for continuous dictation.",
        );
      }
    };
    setStarting(true);
    startupTimer.current = setTimeout(() => {
      setError(
        "Speech recognition did not start. Check microphone permission; the browser's speech service may be unavailable.",
      );
      setStarting(false);
      recognition.onerror = null;
      recognition.abort();
    }, 15000);
    try {
      recognition.start();
    } catch {
      if (startupTimer.current) clearTimeout(startupTimer.current);
      setStarting(false);
      setActive(false);
      setError(
        "Could not start dictation. Check microphone permission and browser speech support.",
      );
    }
  };

  return (
    <section className="consult-voice">
      <h2>Voice notes</h2>
      <p>
        Record and save audio below. Optional live dictation can create an
        editable transcript in browsers with a working speech service.
      </p>
      <ConsultationRecorder
        patientId={patientId}
        appointmentId={appointmentId}
        disabled={disabled || active || starting}
        onRecording={setAudioBusy}
      />
      <h3 className="font-semibold">Live dictation (browser speech service)</h3>
      {!supported && (
        <p role="status">
          Speech recognition is not available in this browser. You can type or
          paste a transcript below.
        </p>
      )}
      <label className="consult-consent">
        <input
          type="checkbox"
          checked={permission}
          disabled={active || starting || disabled}
          onChange={(e) => setPermission(e.target.checked)}
        />
        I have permission to dictate this information. Browser speech
        recognition may send audio to its transcription service.
      </label>
      <div className="flex gap-3 items-center">
        <ActionButton
          type="button"
          className="gp-button gp-button-yellow"
          disabled={
            disabled ||
            audioBusy ||
            !supported ||
            (!active && !starting && !permission)
          }
          onClick={() => {
            if (active || starting) {
              stoppedByUser.current = true;
              ref.current?.stop();
            } else start();
          }}
        >
          {active ? <Square size={15} /> : <Mic size={15} />}{" "}
          {starting
            ? "Cancel connecting"
            : active
              ? "Stop dictation"
              : "Start dictation"}
        </ActionButton>
        <span
          role="status"
          className={active ? "text-red-700" : "text-muted-foreground"}
        >
          {starting
            ? "Connecting to speech service…"
            : active
              ? "● Listening — speak now"
              : "Microphone off"}
        </span>
      </div>
      {interim && (
        <p className="italic" aria-live="polite">
          {interim}
        </p>
      )}
      {error && (
        <p role="alert" className="text-red-700">
          {error}
        </p>
      )}
      <label htmlFor="consult-transcript">Transcript for review</label>
      <textarea
        id="consult-transcript"
        rows={7}
        value={value}
        maxLength={60000}
        disabled={disabled || active || starting}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Your dictated words appear here. Check names, medicines, numbers and negations before adding them to the notes."
      />
      <div className="flex flex-wrap gap-3">
        <select
          aria-label="Insert transcript into"
          value={section}
          disabled={disabled || active || starting}
          onChange={(e) => setSection(e.target.value)}
        >
          <option value="history">History</option>
          <option value="examination">Examination</option>
          <option value="assessment">Assessment</option>
          <option value="plan">Plan</option>
        </select>
        <ActionButton
          type="button"
          className="gp-button"
          disabled={disabled || active || starting || !value.trim()}
          onClick={() => onInsert(section)}
        >
          Insert reviewed text
        </ActionButton>
      </div>
    </section>
  );
}
