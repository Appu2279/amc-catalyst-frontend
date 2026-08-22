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
