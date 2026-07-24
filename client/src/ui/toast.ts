import type { ReactNode } from 'react';
import { notification } from 'antd';

type ToastColor = string | undefined;

function mapType(color: ToastColor): 'success' | 'error' | 'warning' | 'info' {
	if (color === 'red' || color === 'danger') {
		return 'error';
	}
	if (color === 'green' || color === 'teal') {
		return 'success';
	}
	if (color === 'yellow' || color === 'orange' || color === 'warning') {
		return 'warning';
	}
	return 'info';
}

/** Совместимый API с mantine notifications.show для поэтапной миграции. */
export const notifications = {
	show(input: {
		message?: ReactNode;
		title?: ReactNode;
		color?: string;
		autoClose?: number | false;
	}): void {
		const description =
			typeof input.message === 'string' || input.message == null
				? (input.message ?? undefined)
				: String(input.message);
		const message =
			typeof input.title === 'string' || input.title == null
				? (input.title ?? undefined)
				: String(input.title);

		notification.open({
			message: message || description,
			description: message ? description : undefined,
			type: mapType(input.color),
			placement: 'topRight',
			duration:
				input.autoClose === false
					? 0
					: typeof input.autoClose === 'number'
						? input.autoClose / 1000
						: 4.5,
		});
	},
};
