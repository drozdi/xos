import { Alert, Divider, Flex, Select, Switch, Typography } from 'antd';
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
		<div className="game-sidebar__paper" style={{ padding: 16, borderRadius: 8, border: '1px solid var(--xos-shell-border)' }}>
			<Flex vertical gap="middle">
				<Typography.Title level={4} style={{ margin: 0 }}>
					Настройки
				</Typography.Title>

				<ThemeSwitch />

				<Divider style={{ margin: 0 }} />

				<div>
					<Typography.Text style={{ display: 'block', marginBottom: 4 }}>Уровень подсказок</Typography.Text>
					<Typography.Text type="secondary" style={{ display: 'block', fontSize: 12, marginBottom: 8 }}>
						{currentHint.description}
					</Typography.Text>
					<Select
						style={{ width: '100%' }}
						value={String(hintLevel)}
						onChange={(value) => onHintLevelChange(Number(value))}
						options={HINT_LEVELS.map((item) => ({
							value: String(item.id),
							label: item.name,
						}))}
					/>
				</div>

				<Divider style={{ margin: 0 }} />

				<div>
					<Switch
						checked={touchMoveEnabled}
						onChange={(checked) => onTouchMoveChange(checked)}
					/>
					<span style={{ marginLeft: 8 }}>Правило «взялся — ходи»</span>
					<Typography.Text type="secondary" style={{ display: 'block', fontSize: 12, marginTop: 4 }}>
						{touchMoveEnabled
							? 'Коснулись фигуры — нужно завершить ход ею или взять выбранную цель.'
							: 'Свободный выбор и отмена выделения фигуры.'}
					</Typography.Text>
				</div>

				{touchMoveEnabled && touchLockedCell?.figure ? (
					<Alert
						type="warning"
						showIcon
						message="Зафиксирован ход"
						description={
							<>
								{touchLockedCell.figure.label}
								{touchCaptureTarget?.figure ? <> → взять {touchCaptureTarget.figure.label}</> : null}
							</>
						}
					/>
				) : null}

				{touchMoveEnabled && !touchLockedCell && touchCaptureTarget?.figure ? (
					<Alert
						type="warning"
						showIcon
						message="Нужно взять"
						description={`${touchCaptureTarget.figure.label} — выберите свою фигуру`}
					/>
				) : null}

				{touchMessage ? (
					<Alert type="warning" showIcon message={touchMessage} />
				) : null}

				<Divider style={{ margin: 0 }} />

				<GameRulesModal />
			</Flex>
		</div>
	);
}

export default GameSettingsPanel;
