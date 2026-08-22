import axiosInstance from '@/lib/axiosInstance';

// Questions
export const getQuestionsAdmin = (params) => axiosInstance.get('/questions/admin', { params });
export const getQuestionAdmin = (id) => axiosInstance.get(`/questions/admin/${id}`);
export const createQuestion = (data) => axiosInstance.post('/questions/admin', data);
export const updateQuestion = (id, data) => axiosInstance.put(`/questions/admin/${id}`, data);
export const deleteQuestion = (id) => axiosInstance.delete(`/questions/admin/${id}`);
export const toggleQuestion = (id) => axiosInstance.patch(`/questions/admin/${id}/toggle`);

// Import Batches
export const getImportBatches = () => axiosInstance.get('/admin/import-batches');
export const createImportBatch = (data) => axiosInstance.post('/admin/import-batches', data);
export const getImportBatch = (id) => axiosInstance.get(`/admin/import-batches/${id}`);
export const approveImportBatch = (id) => axiosInstance.post(`/admin/import-batches/${id}/approve`);
export const deleteImportBatch = (id) => axiosInstance.delete(`/admin/import-batches/${id}`);
// Show/hide a whole batch for students. Reversible — nothing is deleted.
export const setBatchVisibility = (id, is_visible) =>
  axiosInstance.patch(`/admin/import-batches/${id}/visibility`, { is_visible });

// Mock Tests
export const getMockTests = () => axiosInstance.get('/admin/mock-tests');
export const createMockTest = (data) => axiosInstance.post('/admin/mock-tests', data);
export const getMockTest = (id) => axiosInstance.get(`/admin/mock-tests/${id}`);
export const updateMockTest = (id, data) => axiosInstance.put(`/admin/mock-tests/${id}`, data);
export const deleteMockTest = (id) => axiosInstance.delete(`/admin/mock-tests/${id}`);
export const togglePublishMockTest = (id) => axiosInstance.patch(`/admin/mock-tests/${id}/publish`);
export const addMockTestQuestions = (id, questions) =>
  axiosInstance.post(`/admin/mock-tests/${id}/questions`, { questions });
export const removeMockTestQuestion = (id, qId) =>
  axiosInstance.delete(`/admin/mock-tests/${id}/questions/${qId}`);
export const getQuestionPool = () => axiosInstance.get('/admin/mock-tests/question-pool');

// Subjects & Topics
export const getSubjects = () => axiosInstance.get('/subjects');
export const createSubject = (data) => axiosInstance.post('/subjects', data);
export const updateSubject = (id, data) => axiosInstance.put(`/subjects/${id}`, data);
export const deleteSubject = (id) => axiosInstance.delete(`/subjects/${id}`);
export const getSubjectTopics = (id) => axiosInstance.get(`/subjects/${id}/topics`);
export const createTopic = (data) => axiosInstance.post('/subjects/topics/create', data);
export const updateTopic = (id, data) => axiosInstance.put(`/subjects/topics/${id}`, data);
export const deleteTopic = (id) => axiosInstance.delete(`/subjects/topics/${id}`);

// Courses
export const getCourses = () => axiosInstance.get('/courses');
export const createCourse = (data) => axiosInstance.post('/courses', data);
export const updateCourse = (id, data) => axiosInstance.put(`/courses/${id}`, data);
export const deleteCourse = (id) => axiosInstance.delete(`/courses/${id}`);

// Features (shared pool)
export const getFeatures = () => axiosInstance.get('/features');
export const createFeature = (data) => axiosInstance.post('/features', data);
export const deleteFeature = (id) => axiosInstance.delete(`/features/${id}`);

// Benefits (shared pool)
export const getBenefits = () => axiosInstance.get('/benefits');
export const createBenefit = (data) => axiosInstance.post('/benefits', data);
export const deleteBenefit = (id) => axiosInstance.delete(`/benefits/${id}`);

// ── Notes ─────────────────────────────────────────────────────────────────────
export const getNotesAdmin = () => axiosInstance.get('/notes/admin');

/**
 * Uploads a note PDF.
 *
 * Content-Type is set to null on purpose. The shared instance defaults to
 * application/json, and axios would then JSON-stringify the FormData instead of
 * sending the file. Nulling it drops the header entirely so the browser sets
 * multipart/form-data with the boundary multer needs — setting the string
 * 'multipart/form-data' by hand does NOT work, because it arrives without a
 * boundary and the upload fails to parse.
 *
 * The default 10s timeout is also lifted: this is a whole PDF on whatever
 * connection the admin happens to be on.
 */
export const uploadNote = (formData, onUploadProgress) =>
  axiosInstance.post('/notes/admin', formData, {
    headers: { 'Content-Type': null },
    timeout: 300000,
    onUploadProgress,
  });

export const updateNoteAdmin = (id, data) => axiosInstance.put(`/notes/admin/${id}`, data);
export const deleteNoteAdmin = (id) => axiosInstance.delete(`/notes/admin/${id}`);
