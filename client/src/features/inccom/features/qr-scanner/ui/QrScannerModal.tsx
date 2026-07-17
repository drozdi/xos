import type { ParsedFiscalQr } from '@inccom/shared/lib/parse-fiscal-qr';

interface QrScannerModalProps {
	opened: boolean;
	onClose: () => void;
	onScan?: (value: string) => void;
	onParsed?: (data: ParsedFiscalQr) => void;
}

export function QrScannerModal({ opened, onClose }: QrScannerModalProps) {
	if (!opened) {
		return null;
	}

	return (
		<div>
			<p>QR-сканер недоступен в XOS.</p>
			<button type="button" onClick={onClose}>
				Закрыть
			</button>
		</div>
	);
}
