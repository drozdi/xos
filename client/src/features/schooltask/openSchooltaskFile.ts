import { notifyApiError } from '@/core/api/apiError';
import { schooltaskApi } from '@/core/api/endpoints/schooltaskApi';

function triggerBlobDownload(blob: Blob, fileName: string): void {
	const objectUrl = URL.createObjectURL(blob);
	const anchor = document.createElement('a');
	anchor.href = objectUrl;
	anchor.download = fileName;
	anchor.rel = 'noopener';
	document.body.appendChild(anchor);
	anchor.click();
	anchor.remove();
	URL.revokeObjectURL(objectUrl);
}

export async function openSchooltaskFile(id: number, fileName: string): Promise<void> {
	try {
		const blob = await schooltaskApi.downloadFile(id, 'inline');
		const objectUrl = URL.createObjectURL(blob);
		const opened = window.open(objectUrl, '_blank', 'noopener,noreferrer');
		if (!opened) {
			triggerBlobDownload(blob, fileName);
		}
		window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
	} catch (error) {
		notifyApiError(error, 'Не удалось открыть файл');
	}
}

export async function downloadSchooltaskFile(id: number, fileName: string): Promise<void> {
	try {
		const blob = await schooltaskApi.downloadFile(id, 'attachment');
		triggerBlobDownload(blob, fileName);
	} catch (error) {
		notifyApiError(error, 'Не удалось скачать файл');
	}
}
