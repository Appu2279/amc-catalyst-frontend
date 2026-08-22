import axiosInstance from "../lib/axiosInstance";

// ── Study notes ───────────────────────────────────────────────────────────────
export const getNotes = () => axiosInstance.get('/notes');

/**
 * Fetches the PDF through the authenticated endpoint, so the Authorization
 * header is sent and the Cloudinary URL never reaches the DOM.
 *
 * arraybuffer rather than blob on purpose: the bytes go straight into PDF.js
 * and are drawn to a canvas, so there is never a blob: URL sitting in the DOM
 * for someone to open in a new tab or hand to a download.
 *
 * The default 10s instance timeout is raised here: notes are whole documents,
 * not thumbnails, and a slow connection on a 20MB PDF would otherwise abort a
 * download that was progressing fine.
 */
export const getNoteFile = (id) =>
  axiosInstance.get(`/notes/${id}/file`, { responseType: 'arraybuffer', timeout: 120000 });
