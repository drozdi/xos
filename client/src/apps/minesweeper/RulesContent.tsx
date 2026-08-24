import { Stack, Text, Title } from '@mantine/core';

export function RulesContent() {
	return (
		<Stack gap="sm" p="md">
			<Title order={5}>Сапёр</Title>
			<Text size="sm">
				Откройте все клетки без мин. Цифра показывает, сколько мин рядом с клеткой.
			</Text>
			<Text size="sm">ЛКМ — открыть, ПКМ — флаг. Клик по цифре с верным числом флагов открывает соседей.</Text>
			<Text size="sm" c="dimmed">
				Сложности: Новичок 9×9 (10), Любитель 16×16 (40), Профессионал 16×30 (99).
			</Text>
		</Stack>
	);
}
