import { modals } from '@mantine/modals';

export interface ConfirmActionOptions {
	title: string;
	message: string;
	confirmLabel?: string;
	cancelLabel?: string;
	confirmColor?: string;
	onConfirm: () => void | Promise<void>;
}

export function confirmAction(options: ConfirmActionOptions): void {
	modals.openConfirmModal({
		title: options.title,
		centered: true,
		children: options.message,
		labels: {
			confirm: options.confirmLabel ?? 'Подтвердить',
			cancel: options.cancelLabel ?? 'Отмена',
		},
		confirmProps: { color: options.confirmColor ?? 'blue' },
		onConfirm: () => {
			void options.onConfirm();
		},
	});
}
