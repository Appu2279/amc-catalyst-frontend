import axiosInstance from "../lib/axiosInstance";

export const getCourses = () => {
  return axiosInstance.get("/courses");
};
// One plan, with its pricing, features and benefits — what checkout shows the
// buyer they are about to pay for.
export const getCourseById = (id) => axiosInstance.get(`/courses/${id}`);
