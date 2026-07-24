import { notification as antdNotification } from 'antd';

const recent = new Set<string>();

function dedupeKey(title: string | undefined, message: string): string {
	return `${title ?? ''}::${message}`;
}

function send(item: { title?: string; message: string; type?: 'success' | 'error' | 'warning' | 'info' }) {
	const key = dedupeKey(item.title, item.message);
	if (recent.has(key)) {
		return;
	}
	recent.add(key);
	window.setTimeout(() => recent.delete(key), 2000);

	antdNotification.open({
		message: item.title,
		description: item.message,
		type: item.type ?? 'info',
		placement: 'top',
		duration: 10,
	});
}

export const notification = {
	error: (title: string, message?: string) => {
		send({
			title: message ? title : undefined,
			message: message || title,
			type: 'error',
		});
	},
	success: (title: string, message?: string) => {
		send({
			title: message ? title : undefined,
			message: message || title,
			type: 'success',
		});
	},
	danger: (title: string, message?: string) => {
		send({
			title: message ? title : undefined,
			message: message || title,
			type: 'warning',
		});
	},
	alert: (title: string, message?: string) => {
		send({
			title: message ? title : undefined,
			message: message || title,
			type: 'info',
		});
	},
};
