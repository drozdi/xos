import { Flex, Typography } from 'antd';

interface ExplorerFooterProps {
	itemCount: number;
	selectedCount: number;
	isLoading: boolean;
}

export function ExplorerFooter({ itemCount, selectedCount, isLoading }: ExplorerFooterProps) {
	return (
		<Flex
			justify="flex-end"
			style={{
				padding: '6px 12px',
				borderTop: '1px solid var(--xos-shell-border)',
				flexShrink: 0,
			}}
		>
			<Typography.Text type="secondary" style={{ fontSize: 12 }}>
				{isLoading ? 'Загрузка…' : `${itemCount} элементов`}
				{selectedCount > 0 ? ` · выбрано ${selectedCount}` : ''}
			</Typography.Text>
		</Flex>
	);
}
