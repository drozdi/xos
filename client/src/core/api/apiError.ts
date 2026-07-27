import { notifications } from '@mantine/notifications';
import axios from 'axios';

import type { ApiError } from '@/types/api.types';

interface NotifiedRequestConfig {
	_errorToastShown?: boolean;
}

export function extractApiErrorMessage(error: unknown, fallback = 'Произошла ошибка'): string {
	if (axios.isAxiosError<ApiError>(error)) {
		const data = error.response?.data;
		if (data && typeof data === 'object') {
			if (typeof data.message === 'string' && data.message.length > 0) {
				return data.message;
			}
			if (typeof data.error === 'string' && data.error.length > 0) {
				return data.error;
			}
		}
		if (error.message) {
			return error.message;
		}
	}

	if (error instanceof Error && error.message) {
		return error.message;
	}

	return fallback;
}

export function wasApiErrorNotified(error: unknown): boolean {
	if (!axios.isAxiosError(error)) {
		return false;
	}

	return Boolean((error.config as NotifiedRequestConfig | undefined)?._errorToastShown);
}

export function notifyApiError(
	error: unknown,
	fallback: string,
	title = 'Ошибка',
): void {
	if (wasApiErrorNotified(error)) {
		return;
	}

	notifications.show({
		color: 'red',
		title,
		message: extractApiErrorMessage(error, fallback),
	});
}

export function extractApiFieldErrors(error: unknown): Record<string, string> {
	if (!axios.isAxiosError<ApiError>(error)) {
		return {};
	}

	const status = error.response?.status;
	if (status !== 400 && status !== 422) {
		return {};
	}

	const data = error.response?.data;
	if (!data || typeof data !== 'object') {
		return {};
	}

	if (data.violations && typeof data.violations === 'object') {
		const fieldErrors: Record<string, string> = {};
		for (const [field, message] of Object.entries(data.violations)) {
			if (typeof message === 'string') {
				fieldErrors[field] = message;
			}
		}
		if (Object.keys(fieldErrors).length > 0) {
			return fieldErrors;
		}
	}

	const fieldErrors: Record<string, string> = {};
	for (const [field, message] of Object.entries(data)) {
		if (field === 'message' || field === 'error' || field === 'code' || field === 'violations') {
			continue;
		}
		if (typeof message === 'string') {
			fieldErrors[field] = message;
		}
	}
	if (Object.keys(fieldErrors).length > 0) {
		return fieldErrors;
	}

	if (typeof data.message === 'string' && data.message.length > 0) {
		const message = data.message;
		if (message.includes('Класс с таким названием')) {
			return { name: message };
		}
		if (message.includes('Подгруппа с таким названием')) {
			return { sub: message };
		}
		if (message.includes('Параллель с таким названием')) {
			return { name: message };
		}
	}

	return {};
}
