interface AxiosLikeError {
	response?: {
		data?: { detail?: string; error?: string };
		detail?: string;
	};
	message?: string;
}

function isAxiosLikeError(error: unknown): error is AxiosLikeError {
	return typeof error === 'object' && error !== null;
}

export function getErrorMessage(
	error: unknown,
	fallback = 'Неизвестная ошибка',
): string {
	if (typeof error === 'string') {
		return error;
	}
	if (!isAxiosLikeError(error)) {
		return fallback;
	}
	return (
		error.response?.data?.detail ||
		error.response?.data?.error ||
		error.response?.detail ||
		error.message ||
		fallback
	);
}
