import axios from 'axios';
import { describe, expect, it } from 'vitest';

import {
	extractApiErrorMessage,
	extractApiFieldErrors,
	wasApiErrorNotified,
} from '@/core/api/apiError';

describe('apiError', () => {
	it('extracts message from axios response', () => {
		const error = new axios.AxiosError(
			'Request failed',
			'403',
			{ _errorToastShown: true } as never,
			undefined,
			{
				status: 403,
				data: { message: 'Нет прав на просмотр подразделений' },
			} as never,
		);

		expect(extractApiErrorMessage(error, 'fallback')).toBe('Нет прав на просмотр подразделений');
		expect(wasApiErrorNotified(error)).toBe(true);
	});

	it('extracts field errors from 400 response', () => {
		const error = new axios.AxiosError(
			'Bad Request',
			'400',
			undefined,
			undefined,
			{
				status: 400,
				data: { code: 'Код должен быть указан', name: 'Название должно быть указано' },
			} as never,
		);

		expect(extractApiFieldErrors(error)).toEqual({
			name: 'Название должно быть указано',
		});
	});

	it('maps 422 uniqueness message to name field', () => {
		const error = new axios.AxiosError(
			'Unprocessable',
			'422',
			undefined,
			undefined,
			{
				status: 422,
				data: { message: 'Класс с таким названием уже существует' },
			} as never,
		);

		expect(extractApiFieldErrors(error)).toEqual({
			name: 'Класс с таким названием уже существует',
		});
	});
});
