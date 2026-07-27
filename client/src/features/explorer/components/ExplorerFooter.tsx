import { Group, Text } from '@mantine/core';

interface ExplorerFooterProps {
	itemCount: number;
	selectedCount: number;
	isLoading: boolean;
}

export function ExplorerFooter({ itemCount, selectedCount, isLoading }: ExplorerFooterProps) {
	return (
		<Group
			justify="flex-end"
			px="sm"
			py={6}
			style={{ borderTop: '1px solid var(--mantine-color-default-border)', flexShrink: 0 }}
		>
			<Text size="xs" c="dimmed">
				{isLoading ? 'Загрузка…' : `${itemCount} элементов`}
				{selectedCount > 0 ? ` · выбрано ${selectedCount}` : ''}
			</Text>
		</Group>
	);
}
