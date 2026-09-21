import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import API, { getApiErrorMessage } from "@/utils/api";
import { ActionButton } from "@/components/action-feedback";

export type PatientDocument = {
  id: string;
  name: string;
  size: number;
  createdAt: string;
  kind: string;
  appointmentId?: string;
};
export async function uploadPatientFile(
  patientId: string,
  file: File,
  appointmentId?: string,
) {
  const body = new FormData();
  body.append("file", file);
  if (appointmentId) body.append("appointmentId", appointmentId);
  return (
    await API.post<PatientDocument>(`/patients/${patientId}/documents`, body)
  ).data;
}
function DocumentRow({
  doc,
  patientId,
}: {
  doc: PatientDocument;
  patientId: string;
}) {
  const [url, setUrl] = useState("");
  useEffect(
    () => () => {
      if (url) URL.revokeObjectURL(url);
    },
    [url],
  );
  async function open() {
    const response = await API.get(
      `/patients/${patientId}/documents/${doc.id}/download`,
      { responseType: "blob" },
    );
    const blobUrl = URL.createObjectURL(response.data);
    if (doc.kind === "audio") {
      setUrl(blobUrl);
      return;
    }
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = doc.name;
    link.click();
    setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
  }
  return (
    <li className="border-t py-4 flex flex-wrap items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="font-medium break-all">{doc.name}</p>
        <p className="text-sm text-muted-foreground">
          {new Date(doc.createdAt).toLocaleString()} ·{" "}
          {Math.ceil(doc.size / 1024)} KB
        </p>
        {url && <audio controls src={url} className="mt-2 max-w-full" />}
      </div>
      <ActionButton className="gp-button" onClick={open}>
        {doc.kind === "audio" ? "Play recording" : "Download"}
      </ActionButton>
    </li>
  );
}
export function PatientDocuments({
  patientId,
  appointmentId,
  recordingsOnly = false,
}: {
  patientId: string;
  appointmentId?: string;
  recordingsOnly?: boolean;
}) {
  const input = useRef<HTMLInputElement>(null);
  const client = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const query = useQuery({
    queryKey: ["patient-documents", patientId],
    queryFn: async () =>
      (await API.get<PatientDocument[]>(`/patients/${patientId}/documents`))
        .data,
  });
  const docs = (query.data || []).filter(
    (doc) =>
      !recordingsOnly ||
      (doc.kind === "audio" && doc.appointmentId === appointmentId),
  );
  async function upload(file?: File) {
    if (!file) return;
    setError("");
    setBusy(true);
    try {
      if (file.size > 10 * 1024 * 1024)
        throw new Error("Choose a file up to 10 MB");
      await uploadPatientFile(patientId, file);
      await client.invalidateQueries({
        queryKey: ["patient-documents", patientId],
      });
    } catch (e) {
      setError(getApiErrorMessage(e));
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }
  return (
    <section className="pulse-card p-5">
      <div className="flex flex-wrap justify-between items-center gap-3">
        <h2 className="font-semibold">
          {recordingsOnly ? "Saved recordings" : "Patient documents"}
        </h2>
        {!recordingsOnly && (
          <>
            <input
              ref={input}
              hidden
              type="file"
              accept="application/pdf,image/png,image/jpeg"
              onChange={(e) => void upload(e.target.files?.[0])}
            />
            <ActionButton
              className="gp-button gp-button-yellow"
              disabled={busy}
              onClick={() => input.current?.click()}
            >
              {busy ? "Uploading…" : "Upload document"}
            </ActionButton>
          </>
        )}
      </div>
      {!recordingsOnly && (
        <p className="text-sm text-muted-foreground mt-2">
          PDF, PNG or JPEG · up to 10 MB. Saved securely to this patient’s
          practice record.
        </p>
      )}
      {query.isPending ? (
        <p className="mt-4">Loading documents…</p>
      ) : query.isError ? (
        <p role="alert">
          {getApiErrorMessage(query.error)}{" "}
          <ActionButton onClick={() => query.refetch()}>Retry</ActionButton>
        </p>
      ) : docs.length ? (
        <ul className="mt-4">
          {docs.map((doc) => (
            <DocumentRow key={doc.id} doc={doc} patientId={patientId} />
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-sm">
          {recordingsOnly
            ? "No saved recordings yet."
            : "No documents uploaded yet."}
        </p>
      )}
      {error && (
        <p role="alert" className="text-red-700 mt-3">
          {error}
        </p>
      )}
    </section>
  );
}
