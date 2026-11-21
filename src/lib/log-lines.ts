export type LogLevel = "DEBUG" | "INFO" | "WARNING" | "ERROR" | "CRITICAL";

export type LogEntry = {
  /** 1-based position in the loaded preview, stable while filtering. */
  lineNumber: number;
  text: string;
  level: LogLevel;
  /** False for a continuation line (a stack frame, a wrapped message) that inherited its level. */
  ownLevel: boolean;
  time?: string;
  logger?: string;
  requestId?: string;
  /** actor, tenant, role and src, from the request context suffix. */
  context: Record<string, string>;
  message: string;
};

// Backend format: "[2026-11-21 16:29:17] [INFO] [auth] [request-id] [actor=u1 tenant=t1] message"
const LINE =
  /^\[(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})\] \[(DEBUG|INFO|WARNING|ERROR|CRITICAL)\] \[([^\]]*)\] \[([^\]]*)\](?: \[((?:\w+=\S* ?)+)\])? ?(.*)$/;

export const LEVELS: LogLevel[] = ["CRITICAL", "ERROR", "WARNING", "INFO", "DEBUG"];

function parseContext(raw?: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const part of (raw ?? "").trim().split(/\s+/)) {
    const [key, ...rest] = part.split("=");
    if (key && rest.length) out[key] = rest.join("=");
  }
  return out;
}

/** Splits preview text into entries. A line without the header inherits the level of the entry above,
 * so a stack trace stays attached to the error that produced it when filtering by level. */
export function parseLogLines(text: string): LogEntry[] {
  if (!text) return [];
  const raw = text.split("\n");
  if (raw[raw.length - 1] === "") raw.pop();
  let current: LogLevel = "INFO";
  return raw.map((line, index) => {
    const m = line.match(LINE);
    if (m) {
      current = m[2] as LogLevel;
      return {
        lineNumber: index + 1,
        text: line,
        level: current,
        ownLevel: true,
        time: m[1],
        logger: m[3],
        requestId: m[4] === "-" ? undefined : m[4],
        context: parseContext(m[5]),
        message: m[6],
      };
    }
    return { lineNumber: index + 1, text: line, level: current, ownLevel: false, context: {}, message: line };
  });
}

export function countByLevel(entries: LogEntry[]): Record<LogLevel, number> {
  const counts: Record<LogLevel, number> = { DEBUG: 0, INFO: 0, WARNING: 0, ERROR: 0, CRITICAL: 0 };
  for (const e of entries) if (e.ownLevel) counts[e.level] += 1;
  return counts;
}

export function filterLogEntries(
  entries: LogEntry[],
  { search, levels }: { search: string; levels: Set<LogLevel> },
): LogEntry[] {
  const needle = search.trim().toLowerCase();
  return entries.filter(
    (e) => levels.has(e.level) && (!needle || e.text.toLowerCase().includes(needle)),
  );
}

/** Splits text around case-insensitive matches of `needle`, for highlighting. */
export function splitMatches(text: string, needle: string): { text: string; match: boolean }[] {
  const n = needle.trim();
  if (!n) return [{ text, match: false }];
  const parts: { text: string; match: boolean }[] = [];
  const lower = text.toLowerCase();
  const target = n.toLowerCase();
  let from = 0;
  for (;;) {
    const at = lower.indexOf(target, from);
    if (at === -1) break;
    if (at > from) parts.push({ text: text.slice(from, at), match: false });
    parts.push({ text: text.slice(at, at + target.length), match: true });
    from = at + target.length;
  }
  if (from < text.length) parts.push({ text: text.slice(from), match: false });
  return parts;
}
