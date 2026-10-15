import { Box, Button, Stack, Text, TextInput } from '@mantine/core';
import { useEffect, useState } from 'react';

import { useAppManager } from '@/core/appManager';
import { userDataApi } from '@/core/api/endpoints/userData';
import { WidgetBody } from '@/core/desktop/WidgetSurface';
import { EXPLORER_LAST_PATH_CODE } from '@/features/explorer/explorerLastPath';
import { useWindowTitle } from '@/core/hooks/useWindowTitle';

const PINS = 'explorer.pins';

function asPaths(value: unknown): string[] {
	if (!Array.isArray(value)) {
		return [];
	}
	return value.filter((item): item is string => typeof item === 'string' && item.length > 0);
}

export default function WidgetExplorerApp() {
	useWindowTitle('Файлы');
	const launchApp = useAppManager((s) => s.launchApp);
	const [lastPath, setLastPath] = useState('');
	const [pins, setPins] = useState<string[]>([]);
	const [draft, setDraft] = useState('');

	useEffect(() => {
		void (async () => {
			const last = await userDataApi.getOptional(EXPLORER_LAST_PATH_CODE);
			const path =
				last?.value && typeof last.value === 'object' && 'path' in last.value
					? String((last.value as { path?: unknown }).path ?? '')
					: '';
			setLastPath(path);
			const saved = await userDataApi.getOptional(PINS);
			setPins(asPaths(saved?.value));
		})();
	}, []);

	const open = (path: string) => {
		void launchApp('explorer', { props: { path } });
	};

	const pin = async () => {
		const path = draft.trim();
		if (!path || pins.includes(path)) {
			return;
		}
		const next = [...pins, path];
		setPins(next);
		setDraft('');
		await userDataApi.upsert({ code: PINS, value: next });
	};

	return (
		<WidgetBody>
			<Box p={10}>
				<Stack gap={4}>
					{lastPath ? (
						<Text size="xs" style={{ cursor: 'pointer' }} onClick={() => open(lastPath)}>
							Недавнее: {lastPath}
						</Text>
					) : (
						<Text size="xs" c="dimmed">
							Нет недавнего пути
						</Text>
					)}
					{pins.map((path) => (
						<Text key={path} size="xs" style={{ cursor: 'pointer' }} onClick={() => open(path)}>
							{path}
						</Text>
					))}
					<TextInput
						size="xs"
						placeholder="home://Docs"
						value={draft}
						onChange={(event) => setDraft(event.currentTarget.value)}
					/>
					<Button size="compact-xs" variant="light" onClick={() => void pin()}>
						Закрепить
					</Button>
				</Stack>
			</Box>
		</WidgetBody>
	);
}
