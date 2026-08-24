import { Button, Radio, Stack, Text } from '@mantine/core';
import { useState } from 'react';

import { useAppContext } from '@/core/context/AppContext';
import { useCoreApiContext } from '@/core/context/CoreApiContext';

import type { DrawMode } from './gameLogic';
import { useSolitaireStore } from './store';

export function NewGameDialog() {
	const { windowId } = useAppContext();
	const coreApi = useCoreApiContext();
	const startGame = useSolitaireStore((s) => s.startGame);
	const closeActiveDialog = useSolitaireStore((s) => s.closeActiveDialog);
	const current = useSolitaireStore((s) => s.drawMode);
	const [drawMode, setDrawMode] = useState<string>(String(current));

	const handleStart = () => {
		const mode = (Number(drawMode) === 1 ? 1 : 3) as DrawMode;
		startGame(mode);
		coreApi.window.setSize(900, 640);
		closeActiveDialog(windowId);
	};

	return (
		<Stack gap="md">
			<Text size="sm" c="dimmed">
				Новая раздача. Выберите, сколько карт открывать из стока.
			</Text>
			<Radio.Group value={drawMode} onChange={setDrawMode}>
				<Stack gap="sm">
					<Radio value="3" label="По 3 карты (классика)" />
					<Radio value="1" label="По 1 карте" />
				</Stack>
			</Radio.Group>
			<Button onClick={handleStart}>Раздать</Button>
		</Stack>
	);
}
