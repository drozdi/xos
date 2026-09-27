import { Loader, Stack, Text } from '@mantine/core';
import { useEffect, useRef } from 'react';

import { useAppManager } from '@/core/appManager';
import { useAppContext } from '@/core/context/AppContext';
import { useWindowTitle } from '@/core/hooks/useWindowTitle';
import { getWindowApi } from '@/core/windowManager/windowApiRegistry';

/**
 * Legacy alias: opens unified Settings on the Shell tab, then closes itself.
 */
export default function ShellSettingsApp() {
	useWindowTitle('Макет оболочки');
	const { windowId } = useAppContext();
	const launchApp = useAppManager((s) => s.launchApp);
	const started = useRef(false);

	useEffect(() => {
		if (started.current) {
			return;
		}
		started.current = true;
		void (async () => {
			await launchApp('settings', {
				props: { tab: 'shell' },
				skipHistory: false,
			});
			await getWindowApi(windowId)?.close(true);
		})();
	}, [launchApp, windowId]);

	return (
		<Stack align="center" justify="center" h="100%" p="md" gap="xs">
			<Loader size="sm" />
			<Text size="sm" c="dimmed">
				Открываем Настройки…
			</Text>
		</Stack>
	);
}
