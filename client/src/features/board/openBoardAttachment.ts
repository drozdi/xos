import { notifyApiError } from '@/core/api/apiError';
import { boardApi } from '@/core/api/endpoints/boardApi';

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

export async function openBoardAttachment(id: number, fileName: string): Promise<void> {
	try {
		const blob = await boardApi.downloadAttachment(id, 'inline');
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

export async function downloadBoardAttachment(id: number, fileName: string): Promise<void> {
	try {
		const blob = await boardApi.downloadAttachment(id, 'attachment');
		triggerBlobDownload(blob, fileName);
	} catch (error) {
		notifyApiError(error, 'Не удалось скачать файл');
	}
}
