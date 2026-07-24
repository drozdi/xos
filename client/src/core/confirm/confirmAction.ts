import { Modal } from 'antd';

export interface ConfirmActionOptions {
	title: string;
	message: string;
	confirmLabel?: string;
	cancelLabel?: string;
	confirmColor?: string;
	onConfirm: () => void | Promise<void>;
}

export function confirmAction(options: ConfirmActionOptions): void {
	const danger = options.confirmColor === 'red' || options.confirmColor === 'danger';
	Modal.confirm({
		title: options.title,
		content: options.message,
		okText: options.confirmLabel ?? 'Подтвердить',
		cancelText: options.cancelLabel ?? 'Отмена',
		okButtonProps: danger ? { danger: true } : undefined,
		centered: true,
		onOk: () => options.onConfirm(),
	});
}
