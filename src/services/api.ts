import axios, { type InternalAxiosRequestConfig } from "axios";
import { API_URL } from "../config/config";

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem("authToken");

  if (!token) {
    return config;
  }

  config.headers.set("Authorization", `Bearer ${token}`);

  return config;
});

export default api;
