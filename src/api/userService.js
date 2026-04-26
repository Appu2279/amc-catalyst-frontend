import axiosInstance from "../lib/axiosInstance";


export const getUsers = () => {
  return axiosInstance.get("/users");
};

export const registerUser = (data) => {
  return axiosInstance.post("/auth/register", data);
};

export const loginUser = (data) => {
  return axiosInstance.post("/auth/login", data);
}

