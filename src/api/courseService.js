import axiosInstance from "../lib/axiosInstance";

export const getCourses = () => {
  return axiosInstance.get("/courses");
};