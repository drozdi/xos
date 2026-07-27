import { List, Stack, Text, Title } from '@mantine/core';

export function RulesContent() {
	return (
		<Stack gap="sm">
			<Title order={5}>Судоку</Title>
			<Text size="sm">
				Заполните поле цифрами так, чтобы в каждой строке, столбце и блоке не было повторов.
			</Text>
			<Title order={6}>Размеры</Title>
			<List size="sm" spacing="xs">
				<List.Item>4×4 — блоки 2×2, цифры 1–4.</List.Item>
				<List.Item>6×6 — блоки 2×3, цифры 1–6.</List.Item>
				<List.Item>9×9 — блоки 3×3, цифры 1–9.</List.Item>
			</List>
			<Title order={6}>Ручка и карандаш</Title>
			<List size="sm" spacing="xs">
				<List.Item>
					<Text span fw={500}>Ручка</Text> — ввод окончательного значения в клетку.
				</List.Item>
				<List.Item>
					<Text span fw={500}>Карандаш</Text> — заметки с возможными вариантами. Для 9×9
					клетка делится на сетку 3×3, куда ставятся кандидаты.
				</List.Item>
			</List>
		</Stack>
	);
}
