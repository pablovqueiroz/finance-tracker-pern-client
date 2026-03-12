const configuredApiUrl = import.meta.env.VITE_API_URL?.trim();

const API_URL =
  configuredApiUrl || (import.meta.env.DEV ? "http://localhost:5000/api" : "/api");

export { API_URL };
