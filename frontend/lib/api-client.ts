import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Token will be set by the interceptor
let clerkToken: string | null = null;

export const setClerkToken = (token: string | null) => {
  clerkToken = token;
};

// Add token to requests
apiClient.interceptors.request.use((config) => {
  if (clerkToken) {
    config.headers.Authorization = `Bearer ${clerkToken}`;
  }
  return config;
});

// Handle errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Don't auto-redirect on 401, let the component handle it
    // This prevents redirect loops
    return Promise.reject(error);
  }
);

export default apiClient;
