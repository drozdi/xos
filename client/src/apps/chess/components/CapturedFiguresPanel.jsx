import { Paper, Stack, Title, Text, Group, Image, Box } from '@mantine/core';

function FigureList({ figures }) {
	if (!figures.length) {
		return (
			<Text size="sm" c="dimmed">
				Пока нет
			</Text>
		);
	}

	return (
		<Group gap="xs">
			{figures.map((figure) => (
				<Box key={figure.key} w={48} h={48}>
					<Image src={figure.img} alt={figure.label} fit="contain" />
				</Box>
			))}
		</Group>
	);
}

function CapturedFiguresPanel({ lostWhiteFigures, lostBlackFigures }) {
	return (
		<Paper p="md" radius="md" className="game-sidebar__paper">
			<Stack gap="lg">
				<Title order={4}>Съеденные фигуры</Title>

				<Stack gap="xs">
					<Text fw={600} size="sm">
						Белые
					</Text>
					<FigureList figures={lostWhiteFigures} />
				</Stack>

				<Stack gap="xs">
					<Text fw={600} size="sm">
						Чёрные
					</Text>
					<FigureList figures={lostBlackFigures} />
				</Stack>
			</Stack>
		</Paper>
	);
}

export default CapturedFiguresPanel;
