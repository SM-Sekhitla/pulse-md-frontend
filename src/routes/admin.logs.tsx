import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ChevronRight,
  Download,
  FileText,
  Folder,
  RefreshCw,
  Search,
} from "lucide-react";
import { createFileRoute } from "@/lib/router-compat";
import { AdminShell } from "@/components/admin-shell";
import { ActionButton } from "@/components/action-feedback";
import { useAuth } from "@/context/AuthContext";
import { getApiErrorMessage } from "@/utils/api";
import { systemLogs } from "@/services/system-logs";

export const Route = createFileRoute("/admin/logs")({ component: SystemLogs });

function sizeLabel(bytes: number | null) {
  if (bytes == null) return "Folder";
  if (bytes < 1024) return `${bytes} B`;
  return bytes < 1024 * 1024
    ? `${(bytes / 1024).toFixed(1)} KB`
    : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function SystemLogs() {
  const { user } = useAuth();
  const allowed = user?.role === "super-admin";
  const [path, setPath] = useState("");
  const [file, setFile] = useState("");
  const [folderSearch, setFolderSearch] = useState("");
  const [search, setSearch] = useState("");
  const [level, setLevel] = useState("all");
  const [lines, setLines] = useState(300);
  const [live, setLive] = useState(false);
  const folder = useQuery({
    queryKey: ["admin-system-log-folder", path],
    queryFn: () => systemLogs.folder(path),
    enabled: allowed,
    retry: false,
  });
  const preview = useQuery({
    queryKey: ["admin-system-log-preview", file, lines],
    queryFn: () => systemLogs.preview(file, lines),
    enabled: allowed && Boolean(file),
    retry: false,
    refetchInterval: live ? 5000 : false,
    refetchIntervalInBackground: false,
  });
  const entries = (folder.data?.entries || []).filter((e) =>
    e.name.toLowerCase().includes(folderSearch.toLowerCase()),
  );
  const text = useMemo(() => {
    if (!preview.data) return "";
    if (!search && level === "all") return preview.data.text;
    return preview.data.text
      .split("\n")
      .filter(
        (line) =>
          (!search || line.toLowerCase().includes(search.toLowerCase())) &&
          (level === "all" || new RegExp(`\\b${level}\\b`).test(line)),
      )
      .join("\n");
  }, [preview.data, search, level]);
  const openFolder = (next: string) => {
    setPath(next);
    setFile("");
    setFolderSearch("");
    setSearch("");
    setLevel("all");
  };
  const pieces = path ? path.split("/") : [];

  return (
    <AdminShell title="System logs">
      {allowed && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              Browse backend application, module and service logs.
            </p>
            <ActionButton
              type="button"
              className="gp-button border"
              onClick={async () => {
                await Promise.all([
                  folder.refetch(),
                  ...(file ? [preview.refetch()] : []),
                ]);
              }}
            >
              <RefreshCw size={16} /> Refresh
            </ActionButton>
          </div>
          <nav
            aria-label="Log folder"
            className="flex flex-wrap items-center gap-1 rounded-lg border bg-white px-4 py-3 text-sm"
          >
            <ActionButton
              type="button"
              className="rounded px-1 text-blue hover:underline"
              onClick={() => openFolder("")}
            >
              logs
            </ActionButton>
            {pieces.map((piece, index) => (
              <span key={index} className="inline-flex items-center gap-1">
                <ChevronRight size={14} />
                <ActionButton
                  type="button"
                  className="rounded px-1 hover:underline"
                  onClick={() =>
                    openFolder(pieces.slice(0, index + 1).join("/"))
                  }
                >
                  {piece}
                </ActionButton>
              </span>
            ))}
          </nav>
          <div className="grid gap-4 xl:grid-cols-[minmax(260px,340px)_minmax(0,1fr)]">
            <section
              className="pulse-card min-w-0 overflow-hidden"
              aria-label="Log files"
            >
              <div className="relative border-b p-3">
                <Search
                  size={16}
                  className="absolute left-6 top-6 text-muted-foreground"
                />
                <input
                  aria-label="Filter this folder"
                  placeholder="Filter this folder…"
                  className="w-full rounded-md border py-2 pl-9 pr-3 text-sm"
                  value={folderSearch}
                  onChange={(e) => setFolderSearch(e.target.value)}
                />
              </div>
              <div
                className="max-h-[620px] overflow-y-auto"
                aria-busy={folder.isFetching}
              >
                {path && (
                  <ActionButton
                    type="button"
                    className="flex w-full items-center gap-2 border-b px-4 py-3 text-left text-sm"
                    onClick={() => openFolder(pieces.slice(0, -1).join("/"))}
                  >
                    <Folder size={16} /> ..
                  </ActionButton>
                )}
                {folder.isPending && (
                  <p className="p-4 text-sm" role="status">
                    Loading log files…
                  </p>
                )}
                {folder.error && (
                  <p className="p-4 text-sm text-red-700" role="alert">
                    {getApiErrorMessage(folder.error)}
                  </p>
                )}
                {entries.map((entry) => (
                  <ActionButton
                    key={entry.path}
                    type="button"
                    aria-pressed={
                      entry.kind === "file" ? file === entry.path : undefined
                    }
                    className={`flex w-full items-center gap-2 border-b px-4 py-3 text-left text-sm hover:bg-surface ${file === entry.path ? "bg-blue-tint font-medium" : ""}`}
                    onClick={() => {
                      if (entry.kind === "directory") openFolder(entry.path);
                      else {
                        setFile(entry.path);
                        setSearch("");
                        setLevel("all");
                      }
                    }}
                  >
                    {entry.kind === "directory" ? (
                      <Folder size={16} className="shrink-0 text-blue" />
                    ) : (
                      <FileText
                        size={16}
                        className="shrink-0 text-muted-foreground"
                      />
                    )}
                    <span className="min-w-0 flex-1 truncate">
                      {entry.name}
                    </span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {sizeLabel(entry.size)}
                    </span>
                  </ActionButton>
                ))}
                {!folder.isPending && !folder.error && entries.length === 0 && (
                  <p className="p-6 text-sm text-muted-foreground">
                    {folderSearch
                      ? "No matching files in this folder."
                      : "No log files in this folder yet."}
                  </p>
                )}
              </div>
            </section>
            <section
              className="pulse-card min-w-0 overflow-hidden"
              aria-label="Log preview"
            >
              {!file ? (
                <div className="flex min-h-[360px] flex-col items-center justify-center gap-3 p-8 text-center text-muted-foreground">
                  <FileText size={32} />
                  <h2 className="font-semibold text-navy">Select a log file</h2>
                  <p className="text-sm">
                    Open a module or service folder to inspect its latest
                    entries.
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b p-4">
                    <div className="min-w-0">
                      <h2 className="break-all text-sm font-semibold">
                        {file}
                      </h2>
                      {preview.data && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          {sizeLabel(preview.data.size)} · Modified{" "}
                          {new Date(preview.data.modifiedAt).toLocaleString()}
                        </p>
                      )}
                    </div>
                    <ActionButton
                      type="button"
                      className="gp-button border"
                      onClick={() => systemLogs.download(file)}
                    >
                      <Download size={16} /> Download
                    </ActionButton>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 border-b p-3 text-sm">
                    <input
                      aria-label="Search log preview"
                      placeholder="Search this preview…"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="min-w-[180px] flex-1 rounded-md border p-2"
                    />
                    <select
                      aria-label="Log severity"
                      value={level}
                      onChange={(e) => setLevel(e.target.value)}
                      className="rounded-md border p-2"
                    >
                      {[
                        "all",
                        "INFO",
                        "WARNING",
                        "ERROR",
                        "CRITICAL",
                        "DEBUG",
                      ].map((v) => (
                        <option key={v} value={v}>
                          {v === "all" ? "All levels" : v}
                        </option>
                      ))}
                    </select>
                    <select
                      aria-label="Preview line limit"
                      value={lines}
                      onChange={(e) => setLines(Number(e.target.value))}
                      className="rounded-md border p-2"
                    >
                      {[100, 300, 1000, 2000].map((v) => (
                        <option key={v} value={v}>
                          Last {v} lines
                        </option>
                      ))}
                    </select>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={live}
                        onChange={(e) => setLive(e.target.checked)}
                      />{" "}
                      Auto-refresh
                    </label>
                  </div>
                  {preview.isPending ? (
                    <p role="status" className="p-6">
                      Loading log preview…
                    </p>
                  ) : preview.error ? (
                    <p role="alert" className="p-6 text-sm text-red-700">
                      {getApiErrorMessage(preview.error)}
                    </p>
                  ) : (
                    <>
                      <pre
                        tabIndex={0}
                        className="h-[540px] overflow-auto bg-[#f8fafc] p-4 font-mono text-[11px] leading-5 text-navy"
                      >
                        {text ||
                          (search || level !== "all"
                            ? "No matching entries in this preview."
                            : "This log is empty.")}
                      </pre>
                      <p className="border-t px-4 py-3 text-xs text-muted-foreground">
                        {preview.data?.lines || 0} lines loaded
                        {preview.data?.truncated
                          ? " · Older entries omitted"
                          : ""}
                        . Filters search the loaded preview. Common secret
                        formats are redacted in previews and downloads.
                      </p>
                    </>
                  )}
                </>
              )}
            </section>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
