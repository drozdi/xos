import { List, Stack, Text, Title } from '@mantine/core';

export function RulesContent() {
	return (
		<Stack gap="sm">
			<Title order={5}>Крестики-нолики</Title>
			<Text size="sm">
				Игра для двух игроков: крестики (X) и нолики (O) по очереди ставят символы на поле.
				Побеждает тот, кто первым соберёт нужное число фигур в ряд.
			</Text>
			<Title order={6}>Сложность</Title>
			<List size="sm" spacing="xs">
				<List.Item>Лёгкая — поле 3×3, победа при 3 в ряд.</List.Item>
				<List.Item>Средняя — поле 4×4, победа при 4 в ряд.</List.Item>
				<List.Item>Сложная — поле 5×5, победа при 4 в ряд.</List.Item>
			</List>
			<Title order={6}>Как играть</Title>
			<List size="sm" spacing="xs">
				<List.Item>Игроки ходят по очереди, начинают крестики (X).</List.Item>
				<List.Item>Кликните по свободной клетке, чтобы сделать ход.</List.Item>
				<List.Item>Нельзя ходить в уже занятую клетку.</List.Item>
				<List.Item>
					Если все клетки заполнены и никто не выиграл — объявляется ничья.
				</List.Item>
			</List>
			<Title order={6}>Управление</Title>
			<List size="sm" spacing="xs">
				<List.Item>
					<Text span fw={500}>
						Игра → Новая игра
					</Text>{' '}
					— выбрать сложность и начать новую партию.
				</List.Item>
				<List.Item>
					<Text span fw={500}>
						Справка → О нас
					</Text>{' '}
					— открыть это окно с правилами.
				</List.Item>
			</List>
		</Stack>
	);
}
