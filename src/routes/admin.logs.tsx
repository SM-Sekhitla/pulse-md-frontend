import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ChevronRight,
  Download,
  ArrowDownToLine,
  Copy,
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
import {
  LEVELS,
  countByLevel,
  filterLogEntries,
  parseLogLines,
  splitMatches,
  type LogLevel,
} from "@/lib/log-lines";

const LEVEL_STYLE: Record<LogLevel, string> = {
  CRITICAL: "border-l-red-700 bg-red-50 text-red-900",
  ERROR: "border-l-red-500 bg-red-50/60 text-red-800",
  WARNING: "border-l-amber-500 bg-amber-50/60 text-amber-900",
  INFO: "border-l-transparent",
  DEBUG: "border-l-transparent text-muted-foreground",
};
const LEVEL_CHIP: Record<LogLevel, string> = {
  CRITICAL: "bg-red-700 text-white",
  ERROR: "bg-red-100 text-red-800",
  WARNING: "bg-amber-100 text-amber-900",
  INFO: "bg-slate-100 text-slate-700",
  DEBUG: "bg-slate-50 text-slate-500",
};
const PINNED = [
  { path: "errors.log", label: "All errors and warnings" },
  { path: "services/lifecycle.log", label: "Start-up and health" },
  { path: "modules/activity.log", label: "Who changed what" },
  { path: "services/security.log", label: "Security events" },
  { path: "modules/client_errors.log", label: "Browser errors" },
];

export const Route = createFileRoute("/admin/logs")({ component: SystemLogs });

function sizeLabel(bytes: number | null) {
  if (bytes == null) return "Folder";
  if (bytes < 1024) return `${bytes} B`;
  return bytes < 1024 * 1024
    ? `${(bytes / 1024).toFixed(1)} KB`
    : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function Highlighted({ text, needle }: { text: string; needle: string }) {
  return (
    <>
      {splitMatches(text, needle).map((part, index) =>
        part.match ? (
          <mark key={index} className="rounded bg-yellow-200 px-0.5">
            {part.text}
          </mark>
        ) : (
          <span key={index}>{part.text}</span>
        ),
      )}
    </>
  );
}

function SystemLogs() {
  const { user } = useAuth();
  const allowed = user?.role === "super-admin";
  const [path, setPath] = useState("");
  const [file, setFile] = useState("");
  const [folderSearch, setFolderSearch] = useState("");
  const [search, setSearch] = useState("");
  const [levels, setLevels] = useState<Set<LogLevel>>(new Set(LEVELS));
  const [autoScroll, setAutoScroll] = useState(true);
  const [wrap, setWrap] = useState(true);
  const scroller = useRef<HTMLDivElement | null>(null);
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
  const entries_ = useMemo(() => parseLogLines(preview.data?.text ?? ""), [preview.data]);
  const counts = useMemo(() => countByLevel(entries_), [entries_]);
  const visible = useMemo(
    () => filterLogEntries(entries_, { search, levels }),
    [entries_, search, levels],
  );
  const toggleLevel = (value: LogLevel) =>
    setLevels((current) => {
      const next = new Set(current);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return next;
    });
  const onlyProblems = () => setLevels(new Set<LogLevel>(["WARNING", "ERROR", "CRITICAL"]));
  const allLevels = () => setLevels(new Set(LEVELS));
  const filtered = search !== "" || levels.size !== LEVELS.length;
  useEffect(() => {
    const el = scroller.current;
    if (el && autoScroll) el.scrollTop = el.scrollHeight;
  }, [visible, autoScroll]);
  const downloadView = () => {
    const blob = new Blob([visible.map((e) => e.text).join("\n")], {
      type: "text/plain",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${file.split("/").pop() || "log"}-view.txt`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const copyView = () =>
    navigator.clipboard?.writeText(visible.map((e) => e.text).join("\n"));
  const openFolder = (next: string) => {
    setPath(next);
    setFile("");
    setFolderSearch("");
    setSearch("");
    allLevels();
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
                        allLevels();
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
                    entries, or jump straight to:
                  </p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {PINNED.map((item) => (
                      <ActionButton
                        key={item.path}
                        type="button"
                        className="gp-button border text-xs"
                        onClick={() => {
                          const dir = item.path.includes("/")
                            ? item.path.slice(0, item.path.lastIndexOf("/"))
                            : "";
                          setPath(dir);
                          setFile(item.path);
                          setSearch("");
                          allLevels();
                        }}
                      >
                        {item.label}
                      </ActionButton>
                    ))}
                  </div>
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
                  <div className="flex flex-wrap items-center gap-2 border-b p-3 text-sm">
                    {LEVELS.map((value) => (
                      <button
                        key={value}
                        type="button"
                        aria-pressed={levels.has(value)}
                        onClick={() => toggleLevel(value)}
                        className={`rounded-full px-2.5 py-1 text-xs font-medium transition ${
                          levels.has(value)
                            ? LEVEL_CHIP[value]
                            : "bg-white text-muted-foreground line-through ring-1 ring-inset ring-slate-200"
                        }`}
                      >
                        {value.toLowerCase()} {counts[value]}
                      </button>
                    ))}
                    <button
                      type="button"
                      className="rounded px-2 py-1 text-xs text-blue hover:underline"
                      onClick={onlyProblems}
                    >
                      Problems only
                    </button>
                    {filtered && (
                      <button
                        type="button"
                        className="rounded px-2 py-1 text-xs text-blue hover:underline"
                        onClick={() => {
                          allLevels();
                          setSearch("");
                        }}
                      >
                        Clear filters
                      </button>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-3 border-b p-3 text-sm">
                    <input
                      aria-label="Search log preview"
                      placeholder="Search this preview, or click a request id…"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="min-w-[180px] flex-1 rounded-md border p-2"
                    />
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
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={wrap}
                        onChange={(e) => setWrap(e.target.checked)}
                      />{" "}
                      Wrap lines
                    </label>
                    <ActionButton
                      type="button"
                      className="gp-button border"
                      onClick={copyView}
                      disabled={visible.length === 0}
                    >
                      <Copy size={16} /> Copy view
                    </ActionButton>
                    <ActionButton
                      type="button"
                      className="gp-button border"
                      onClick={downloadView}
                      disabled={visible.length === 0}
                    >
                      <Download size={16} /> Download view
                    </ActionButton>
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
                      <div className="relative">
                        <div
                          ref={scroller}
                          tabIndex={0}
                          onScroll={(e) => {
                            const el = e.currentTarget;
                            setAutoScroll(
                              el.scrollHeight - el.scrollTop - el.clientHeight <
                                24,
                            );
                          }}
                          className="h-[540px] overflow-auto bg-[#f8fafc] py-2 font-mono text-[11px] leading-5 text-navy"
                        >
                          {visible.length === 0 && (
                            <p className="p-4 text-sm text-muted-foreground">
                              {filtered
                                ? "No matching entries in this preview."
                                : "This log is empty."}
                            </p>
                          )}
                          {visible.map((entry) => (
                            <div
                              key={entry.lineNumber}
                              className={`flex gap-3 border-l-2 px-3 ${LEVEL_STYLE[entry.level]} ${
                                entry.ownLevel ? "" : "opacity-80"
                              }`}
                            >
                              <span className="w-10 shrink-0 select-none text-right text-muted-foreground/70">
                                {entry.lineNumber}
                              </span>
                              <span
                                className={`min-w-0 flex-1 ${
                                  wrap
                                    ? "whitespace-pre-wrap break-all"
                                    : "whitespace-pre"
                                }`}
                              >
                                {entry.ownLevel ? (
                                  <>
                                    <span className="text-muted-foreground">
                                      {entry.time}
                                    </span>{" "}
                                    <span
                                      className={`rounded px-1 ${LEVEL_CHIP[entry.level]}`}
                                    >
                                      {entry.level}
                                    </span>{" "}
                                    <span className="text-blue">
                                      {entry.logger}
                                    </span>{" "}
                                    {entry.requestId && (
                                      <button
                                        type="button"
                                        title="Show every line for this request"
                                        className="text-muted-foreground hover:underline"
                                        onClick={() =>
                                          setSearch(entry.requestId ?? "")
                                        }
                                      >
                                        [{entry.requestId.slice(0, 8)}]
                                      </button>
                                    )}
                                    {Object.entries(entry.context).map(
                                      ([key, value]) => (
                                        <span
                                          key={key}
                                          className="ml-1 rounded bg-slate-100 px-1 text-slate-600"
                                        >
                                          {key}={value}
                                        </span>
                                      ),
                                    )}{" "}
                                    <Highlighted
                                      text={entry.message}
                                      needle={search}
                                    />
                                  </>
                                ) : (
                                  <Highlighted
                                    text={entry.text}
                                    needle={search}
                                  />
                                )}
                              </span>
                            </div>
                          ))}
                        </div>
                        {!autoScroll && (
                          <button
                            type="button"
                            onClick={() => setAutoScroll(true)}
                            className="absolute bottom-3 right-5 inline-flex items-center gap-1 rounded-full bg-navy px-3 py-1 text-xs text-white shadow"
                          >
                            <ArrowDownToLine size={12} /> Jump to newest
                          </button>
                        )}
                      </div>
                      <p className="border-t px-4 py-3 text-xs text-muted-foreground">
                        {visible.length} of {entries_.length} lines shown
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
