import axiosInstance from '@/lib/axiosInstance';

// ── Students & public ─────────────────────────────────────────────────────────
// The exam currently switched on (or null). Public: the dashboard nav uses it to
// decide whether to show the Live Exam item at all.
export const getCurrentLiveExam = () => axiosInstance.get('/live-exams/current');
export const startLiveExam      = (id) => axiosInstance.post(`/live-exams/${id}/start`);
export const getLiveExamAttempt = (id) => axiosInstance.get(`/live-exams/${id}/attempt`);
// selected_option_id null clears the answer.
export const saveLiveExamAnswer = (id, data) => axiosInstance.post(`/live-exams/${id}/answer`, data);
export const submitLiveExam     = (id) => axiosInstance.post(`/live-exams/${id}/submit`);
export const getMyLiveExamResult = (id) => axiosInstance.get(`/live-exams/${id}/my-result`);

// Published results — the public pages outside the dashboard.
export const getPublishedResults = () => axiosInstance.get('/live-exams/results');
export const getPublicResults    = (slug) => axiosInstance.get(`/live-exams/results/${encodeURIComponent(slug)}`);

// ── Admin ─────────────────────────────────────────────────────────────────────
export const getLiveExamsAdmin   = () => axiosInstance.get('/admin/live-exams');
export const getLiveExamAdmin    = (id) => axiosInstance.get(`/admin/live-exams/${id}`);
// Paper: { generate: { question_count, duration_minutes } } or { mock_test_id }.
export const createLiveExam      = (data) => axiosInstance.post('/admin/live-exams', data, { timeout: 60000 });
export const updateLiveExam      = (id, data) => axiosInstance.put(`/admin/live-exams/${id}`, data);
export const deleteLiveExam      = (id) => axiosInstance.delete(`/admin/live-exams/${id}`);
export const setLiveExamVisibility = (id, show_in_nav) =>
  axiosInstance.patch(`/admin/live-exams/${id}/visibility`, { show_in_nav });
export const publishLiveExamResults   = (id) => axiosInstance.post(`/admin/live-exams/${id}/publish-results`);
export const unpublishLiveExamResults = (id) => axiosInstance.post(`/admin/live-exams/${id}/unpublish-results`);
// The paper as a PDF (built on the server, figures included — can take ~30 s
// the first time). withAnswers adds answers, explanations and an answer key.
export const getLiveExamPaperPdf = (id, withAnswers) =>
  axiosInstance.get(`/admin/live-exams/${id}/paper.pdf`, {
    params: { answers: withAnswers ? 1 : 0, tz: Intl.DateTimeFormat().resolvedOptions().timeZone },
    responseType: 'blob',
    timeout: 180000,
  });
// Adds a published practice copy of the paper to Mock Exams.
export const releaseLiveExamPaper = (id) => axiosInstance.post(`/admin/live-exams/${id}/release-paper`);
export const getLiveExamResults  = (id) => axiosInstance.get(`/admin/live-exams/${id}/results`, { timeout: 60000 });
export const getLiveExamResultsCsv = (id) =>
  axiosInstance.get(`/admin/live-exams/${id}/results.csv`, { responseType: 'blob', timeout: 60000 });
export const getLiveExamQuestionStats = (id) => axiosInstance.get(`/admin/live-exams/${id}/questions`, { timeout: 60000 });
export const getLiveExamAttemptDetail = (id, attemptId) =>
  axiosInstance.get(`/admin/live-exams/${id}/attempts/${attemptId}`);
export const resetLiveExamAttempt = (id, attemptId) =>
  axiosInstance.delete(`/admin/live-exams/${id}/attempts/${attemptId}`);
