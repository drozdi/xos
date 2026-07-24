import { useCallback, useState } from 'react';

export interface UseDisclosureHandlers {
	open: () => void;
	close: () => void;
	toggle: () => void;
}

export interface UseDisclosureOptions {
	onOpen?: () => void;
	onClose?: () => void;
}

export function useDisclosure(
	initial = false,
	options: UseDisclosureOptions = {},
): [boolean, UseDisclosureHandlers] {
	const [opened, setOpened] = useState(initial);

	const open = useCallback(() => {
		setOpened((current) => {
			if (!current) {
				options.onOpen?.();
			}
			return true;
		});
	}, [options.onOpen]);

	const close = useCallback(() => {
		setOpened((current) => {
			if (current) {
				options.onClose?.();
			}
			return false;
		});
	}, [options.onClose]);

	const toggle = useCallback(() => {
		setOpened((current) => {
			if (current) {
				options.onClose?.();
				return false;
			}
			options.onOpen?.();
			return true;
		});
	}, [options.onClose, options.onOpen]);

	return [opened, { open, close, toggle }];
}
