import {
	Paper,
	Stack,
	Title,
	Text,
	Select,
	Switch,
	Alert,
	Divider,
} from '@mantine/core';
import { HINT_LEVELS } from '../models/hints/HintLevels';
import GameRulesModal from './GameRulesModal';
import ThemeSwitch from './ThemeSwitch';

function GameSettingsPanel({
	hintLevel,
	onHintLevelChange,
	touchMoveEnabled,
	onTouchMoveChange,
	touchLockedCell,
	touchCaptureTarget,
	touchMessage,
}) {
	const currentHint = HINT_LEVELS.find((item) => item.id === hintLevel) ?? HINT_LEVELS[1];

	return (
		<Paper p="md" radius="md" className="game-sidebar__paper">
			<Stack gap="md">
				<Title order={4}>Настройки</Title>

				<ThemeSwitch />

				<Divider />

				<Select
					label="Уровень подсказок"
					description={currentHint.description}
					value={String(hintLevel)}
					onChange={(value) => onHintLevelChange(Number(value))}
					data={HINT_LEVELS.map((item) => ({
						value: String(item.id),
						label: item.name,
					}))}
				/>

				<Divider />

				<Switch
					label="Правило «взялся — ходи»"
					description={
						touchMoveEnabled
							? 'Коснулись фигуры — нужно завершить ход ею или взять выбранную цель.'
							: 'Свободный выбор и отмена выделения фигуры.'
					}
					checked={touchMoveEnabled}
					onChange={(event) => onTouchMoveChange(event.currentTarget.checked)}
				/>

				{touchMoveEnabled && touchLockedCell?.figure && (
					<Alert color="yellow" variant="light" title="Зафиксирован ход">
						{touchLockedCell.figure.label}
						{touchCaptureTarget?.figure && (
							<> → взять {touchCaptureTarget.figure.label}</>
						)}
					</Alert>
				)}

				{touchMoveEnabled && !touchLockedCell && touchCaptureTarget?.figure && (
					<Alert color="yellow" variant="light" title="Нужно взять">
						{touchCaptureTarget.figure.label} — выберите свою фигуру
					</Alert>
				)}

				{touchMessage && (
					<Alert color="orange" variant="light">
						{touchMessage}
					</Alert>
				)}

				<Divider />

				<GameRulesModal />
			</Stack>
		</Paper>
	);
}

export default GameSettingsPanel;
