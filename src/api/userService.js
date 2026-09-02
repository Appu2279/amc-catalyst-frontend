import axiosInstance from "../lib/axiosInstance";

export const getUsers    = () => axiosInstance.get("/users");
export const registerUser = (data) => axiosInstance.post("/auth/register", data);
export const loginUser    = (data) => axiosInstance.post("/auth/login", data);

// ── Subjects & Topics (public) ────────────────────────────────────────────────
export const getSubjectsPublic      = ()   => axiosInstance.get('/subjects');
export const getSubjectTopicsPublic = (id) => axiosInstance.get(`/subjects/${id}/topics`);

// ── Questions (practice: QBank / Recall) ──────────────────────────────────────
// Supports params: source_type, subject_id, topic_id, difficulty, search, page, limit
export const getQuestions    = (params) => axiosInstance.get('/questions', { params });
export const getQuestionById = (id)     => axiosInstance.get(`/questions/${id}`);
// Called only after student picks an option — backend reveals is_correct + explanations
export const checkAnswer     = (id, data) => axiosInstance.post(`/questions/${id}/check`, data);

// Which practice questions this student has already answered, so Recall can
// resume where they stopped — including after logging out or moving device.
// Returns answered question ids rather than a position; see the note in
// question.service.js for why.
// The batches (recall months) a student can choose between. Hidden batches are
// filtered out server-side, so what comes back is exactly what to offer.
export const getQuestionBatches = (params) => axiosInstance.get('/questions/batches', { params });

export const getPracticeProgress = (params) => axiosInstance.get('/questions/progress', { params });

// "Start over" — clears this student's answers for one practice mode so the set
// can be worked through again. source_type is required by the API on purpose.
export const resetPracticeProgress = (params) =>
  axiosInstance.delete('/questions/progress', { params });

// Wraps a raw image URL in the authenticated proxy endpoint so the storage URL
// is never directly exposed and Cache-Control: no-store is enforced server-side.
export const proxyImageUrl = (url) =>
  url ? `/api/images/proxy?url=${encodeURIComponent(url)}` : url;

// ── Analytics ─────────────────────────────────────────────────────────────────
export const getAnalyticsSummary   = ()       => axiosInstance.get('/analytics/summary');
export const getSubjectPerformance = ()       => axiosInstance.get('/analytics/subjects');
export const getWeakTopics         = ()       => axiosInstance.get('/analytics/weak-topics');
export const getAttemptHistory     = (params) => axiosInstance.get('/analytics/history', { params });

// ── Mock Tests (user-facing) ──────────────────────────────────────────────────
export const getPublishedMockTests = ()   => axiosInstance.get('/mock-tests');
export const getMockTestInfo       = (id) => axiosInstance.get(`/mock-tests/${id}`);
export const startMockTest         = (id) => axiosInstance.post(`/mock-tests/${id}/start`);

// ── Attempts ──────────────────────────────────────────────────────────────────
export const getAttempt       = (attemptId)       => axiosInstance.get(`/attempts/${attemptId}`);
export const submitAnswer     = (attemptId, data) => axiosInstance.post(`/attempts/${attemptId}/answer`, data);
export const submitAttempt    = (attemptId)       => axiosInstance.post(`/attempts/${attemptId}/submit`);
export const getAttemptResult = (attemptId)       => axiosInstance.get(`/attempts/${attemptId}/result`);

// ── Access & payments (this student's own) ────────────────────────────────────

/**
 * What this student may open, and the subscriptions behind it.
 *
 * Convenience for rendering only — every gated endpoint checks entitlement
 * again server-side, so a client that ignores this gains nothing. Shape:
 *   { sections: { notes, qbank, recall, mocks }, admin_override, subscriptions[] }
 */
export const getMyAccess = () => axiosInstance.get('/me/access');

// This student's payment claims, newest first. Drives the "under review" banner
// so people stop wondering whether their transfer landed.
export const getMyPaymentClaims = () => axiosInstance.get('/payment-claims/mine');

/**
 * Opens a payment claim for a plan, or returns the one already open.
 *
 * Called when the buyer reaches the QR page rather than when they say they
 * paid: the reference code has to be on screen before they transfer anything,
 * because it is what ties a line in the bank statement back to a person.
 */
export const startPaymentClaim = (courseId) =>
  axiosInstance.post('/payment-claims', { course_id: courseId });

/**
 * Records that the buyer says they have paid.
 *
 * multipart, because it may carry a screenshot. Content-Type is nulled so the
 * browser sets the multipart boundary itself — see uploadNote for why setting
 * the string by hand does not work.
 */
export const submitPaymentClaim = (id, { utr, amount_claimed, screenshot }) => {
  const body = new FormData();
  body.append('utr', utr);
  if (amount_claimed !== undefined && amount_claimed !== '') {
    body.append('amount_claimed', amount_claimed);
  }
  if (screenshot) body.append('screenshot', screenshot);

  return axiosInstance.post(`/payment-claims/${id}/submit`, body, {
    headers: { 'Content-Type': null },
    timeout: 120000,
  });
};
