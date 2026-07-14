import axios, { type AxiosInstance } from 'axios';

const baseURL = import.meta.env.VITE_API_URL ?? '';

export const apiClient = axios.create({
	baseURL,
	headers: { 'Content-Type': 'application/json' },
});

export function getApiClient(): AxiosInstance {
	return apiClient;
}

export { baseURL as apiBaseURL };
