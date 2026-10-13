import axiosInstance from "../lib/axiosInstance";

// ── Study notes ───────────────────────────────────────────────────────────────
export const getNotes = () => axiosInstance.get('/notes');

// Guideline Updates share the notes storage and viewer but list separately.
export const getGuidelineUpdates = () => axiosInstance.get('/notes', { params: { collection: 'guidelines' } });

// No auth required — used on the public marketing homepage, before there is
// an account to attach a token to. See notes/public/covers on the backend.
export const getPublicNoteCovers = () => axiosInstance.get('/notes/public/covers');

// Opened notes are kept for the session so reopening one is instant. Memory
// only: nothing is written to disk, in line with the server's no-store. Cleared
// on logout so the next account on a shared device never sees them.
const MAX_CACHED_BYTES = 60 * 1024 * 1024;
const cachedFiles = new Map(); // note id -> ArrayBuffer, least recently used first

const rememberFile = (id, data) => {
  if (data.byteLength > MAX_CACHED_BYTES) return;
  cachedFiles.delete(id);
  cachedFiles.set(id, data);

  let totalBytes = 0;
  cachedFiles.forEach((cached) => { totalBytes += cached.byteLength; });
  for (const [oldestId, oldest] of cachedFiles) {
    if (totalBytes <= MAX_CACHED_BYTES) break;
    cachedFiles.delete(oldestId);
    totalBytes -= oldest.byteLength;
  }
};

export const clearNoteFileCache = () => cachedFiles.clear();

// Gives up only when nothing has arrived for this long, not after a fixed
// total: on a slow connection a large note can take minutes yet still be
// progressing fine. Generous because the server watermarks the whole PDF
// before the first byte is sent.
const STALL_TIMEOUT_MS = 60000;

/**
 * Fetches the PDF through the authenticated endpoint, so the Authorization
 * header is sent and the storage URL never reaches the DOM.
 *
 * arraybuffer rather than blob on purpose: the bytes go straight into PDF.js
 * and are drawn to a canvas, so there is never a blob: URL sitting in the DOM
 * for someone to open in a new tab or hand to a download.
 *
 * Resolves to the ArrayBuffer. onProgress receives axios progress events
 * ({ loaded, total }); signal cancels the download when the viewer closes.
 */
export const getNoteFile = async (id, { onProgress, signal } = {}) => {
  const cached = cachedFiles.get(id);
  if (cached) {
    rememberFile(id, cached);
    return cached;
  }

  const controller = new AbortController();
  signal?.addEventListener('abort', () => controller.abort());

  let stallTimer;
  const restartStallTimer = () => {
    clearTimeout(stallTimer);
    stallTimer = setTimeout(() => controller.abort(), STALL_TIMEOUT_MS);
  };
  restartStallTimer();

  try {
    const res = await axiosInstance.get(`/notes/${id}/file`, {
      responseType: 'arraybuffer',
      timeout: 0,
      signal: controller.signal,
      onDownloadProgress: (event) => {
        restartStallTimer();
        onProgress?.(event);
      },
    });
    rememberFile(id, res.data);
    return res.data;
  } finally {
    clearTimeout(stallTimer);
  }
};
