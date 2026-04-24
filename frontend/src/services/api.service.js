import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE,
  timeout: 20000,
});

/* Attach JWT to every request if logged in */
api.interceptors.request.use(config => {
  const token = localStorage.getItem("api_studio_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
