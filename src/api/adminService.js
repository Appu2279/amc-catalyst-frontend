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
