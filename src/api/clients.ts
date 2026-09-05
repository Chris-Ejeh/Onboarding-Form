import axios, { AxiosError } from "axios";

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

export interface ApiErrorBody {
  message?: string;
}

export function isApiError<T = ApiErrorBody>(
  error: unknown,
): error is AxiosError<T> {
  return axios.isAxiosError<ApiErrorBody>(error);
}

export function apiErrorStatus(error: unknown): number | undefined {
  return isApiError(error) ? error.response?.status : undefined;
}

export function apiErrorMessage(error: unknown, fallback: string): string {
  return (isApiError(error) && error.response?.data?.message) || fallback;
}
