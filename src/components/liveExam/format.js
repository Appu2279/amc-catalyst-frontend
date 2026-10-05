// Shared formatting for the live exam pages. Times are shown in the viewer's
// own timezone, with the zone named, since candidates may sit from anywhere.

export const fmtDateTime = (value) =>
  value
    ? new Date(value).toLocaleString(undefined, {
        weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
        hour: 'numeric', minute: '2-digit', timeZoneName: 'short',
      })
    : '—';

export const fmtDate = (value) =>
  value ? new Date(value).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' }) : '—';

/** 3725 → "1 h 2 min" */
export const fmtDuration = (seconds) => {
  if (seconds == null) return '—';
  const total = Math.max(0, Math.round(seconds / 60));
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (!h) return `${m} min`;
  return m ? `${h} h ${m} min` : `${h} h`;
};

/** 3725 → "01:02:05" */
export const fmtClock = (seconds) => {
  const s = Math.max(0, Math.floor(seconds ?? 0));
  return [Math.floor(s / 3600), Math.floor((s % 3600) / 60), s % 60].map((n) => String(n).padStart(2, '0')).join(':');
};

/** 93784 → "1d 02h 03m 04s" — for countdowns to the exam opening. */
export const fmtCountdown = (seconds) => {
  const s = Math.max(0, Math.floor(seconds));
  const d = Math.floor(s / 86400);
  const rest = fmtClock(s % 86400).split(':');
  return `${d ? `${d}d ` : ''}${rest[0]}h ${rest[1]}m ${rest[2]}s`;
};

export const errorMessage = (err, fallback) => err?.response?.data?.message || fallback;

/** Milliseconds to add to Date.now() to get the server's clock. */
export const serverOffset = (serverNow) => (serverNow ? new Date(serverNow).getTime() - Date.now() : 0);

// ── Student-facing times ──────────────────────────────────────────────────────
// Students sit from everywhere, and "GMT+5:30" means nothing to most of them.
// So student pages show the time in the reader's own timezone with no zone
// code, say once in plain words which zone that is, and lead with countdowns.

/** "Thu, 8 Oct, 10:00 am" in the viewer's own timezone. */
export const fmtLocalDateTime = (value) =>
  value
    ? new Date(value).toLocaleString(undefined, {
        weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit',
        // Always am/pm: some locales default to a 24-hour "5:30" that reads as ambiguous.
        hour12: true,
      })
    : '—';

/** The viewer's timezone in words, e.g. "India Standard Time" or "Australian Eastern Daylight Time". */
export const localZoneName = () => {
  try {
    const part = new Intl.DateTimeFormat(undefined, { timeZoneName: 'long' })
      .formatToParts(new Date())
      .find((p) => p.type === 'timeZoneName')?.value;
    // Some locales only offer "GMT+05:30" — then the city is clearer.
    if (part && !/^GMT|^UTC/.test(part)) return part;
    return Intl.DateTimeFormat().resolvedOptions().timeZone.split('/').pop().replace(/_/g, ' ');
  } catch {
    return 'your timezone';
  }
};

/** 187200 → "in 2 days 4 h", 12000 → "in 3 h 20 min", 300 → "in 5 min". */
export const fmtRelative = (seconds) => {
  const s = Math.max(0, Math.floor(seconds));
  if (s < 60) return 'in less than a minute';
  const days = Math.floor(s / 86400);
  const hours = Math.floor((s % 86400) / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  if (days) return `in ${days} day${days === 1 ? '' : 's'}${hours ? ` ${hours} h` : ''}`;
  if (hours) return `in ${hours} h${minutes ? ` ${minutes} min` : ''}`;
  return `in ${minutes} min`;
};
