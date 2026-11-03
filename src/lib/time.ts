// Time-zone helpers. Timestamps are stored UTC; sellers type wall-clock times
// in the store's zone (Asia/Jakarta by default) via <input type="datetime-local">.

const LOCAL_RE = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/;

function zoneParts(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(date);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  return { year: get("year"), month: get("month"), day: get("day"), hour: get("hour"), minute: get("minute"), second: get("second") };
}

/** Offset of `timeZone` from UTC at `date`, in milliseconds (Jakarta = +7h). */
function zoneOffsetMs(date: Date, timeZone: string) {
  const p = zoneParts(date, timeZone);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return asUtc - Math.floor(date.getTime() / 1000) * 1000;
}

/** "2026-11-03T00:00" in `timeZone` -> UTC ISO string. Returns null for empty/invalid input. */
export function zonedLocalToUtcIso(local: string | null | undefined, timeZone: string): string | null {
  if (!local) return null;
  const match = LOCAL_RE.exec(local.trim());
  if (!match) return null;
  const [, y, mo, d, h, mi] = match.map(Number);
  const wallAsUtc = Date.UTC(y, mo - 1, d, h, mi);
  const probe = new Date(wallAsUtc);
  // Rejects impossible dates such as 2026-02-31 or 24:00.
  if (probe.getUTCFullYear() !== y || probe.getUTCMonth() + 1 !== mo || probe.getUTCDate() !== d || probe.getUTCHours() !== h) {
    return null;
  }

  // Two passes handle zones whose offset differs across a DST change.
  let utc = wallAsUtc - zoneOffsetMs(probe, timeZone);
  const second = wallAsUtc - zoneOffsetMs(new Date(utc), timeZone);
  if (second !== utc) utc = second;
  return new Date(utc).toISOString();
}

/** UTC ISO string -> "YYYY-MM-DDTHH:mm" wall-clock in `timeZone`, for datetime-local inputs. */
export function utcIsoToZonedLocal(iso: string | null | undefined, timeZone: string): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const p = zoneParts(date, timeZone);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${p.year}-${pad(p.month)}-${pad(p.day)}T${pad(p.hour)}:${pad(p.minute)}`;
}

/** Human-readable timestamp in the store zone, e.g. "3 Nov 2026, 14.00 WIB". */
export function formatInZone(iso: string | null | undefined, timeZone: string): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    timeZone,
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(date);
}
