import { Alert, Button, Flex, Spin, Typography } from 'antd';
import type { ReactNode } from 'react';

interface MainListLayoutProps {
	title: string;
	total?: number;
	isLoading: boolean;
	isError: boolean;
	errorMessage?: string;
	isFetching?: boolean;
	onRefresh: () => void;
	onCreate?: () => void;
	createLabel?: string;
	filters?: ReactNode;
	children: ReactNode;
}

export function MainListLayout({
	title,
	total,
	isLoading,
	isError,
	errorMessage,
	isFetching,
	onRefresh,
	onCreate,
	createLabel = 'Создать',
	filters,
	children,
}: MainListLayoutProps) {
	return (
		<div
			style={{
				position: 'absolute',
				inset: 0,
				display: 'flex',
				flexDirection: 'column',
				minHeight: 0,
				overflow: 'hidden',
				padding: 16,
			}}
		>
			<Flex justify="space-between" align="center" style={{ marginBottom: 16, flexShrink: 0 }} wrap="nowrap">
				<Typography.Text strong>{title}</Typography.Text>
				<Flex gap={8} wrap="nowrap">
					{onCreate ? (
						<Button type="primary" size="small" onClick={onCreate}>
							{createLabel}
						</Button>
					) : null}
					<Button
						size="small"
						onClick={onRefresh}
						loading={Boolean(isFetching && !isLoading)}
					>
						Обновить
					</Button>
				</Flex>
			</Flex>

			{filters ? <div style={{ marginBottom: 16, flexShrink: 0 }}>{filters}</div> : null}

			{isLoading ? (
				<Flex justify="center" style={{ padding: '48px 0' }}>
					<Spin size="small" />
				</Flex>
			) : isError ? (
				<Alert type="error" showIcon message="Ошибка" description={errorMessage ?? 'Не удалось загрузить данные'} />
			) : (
				<div
					style={{
						flex: 1,
						minHeight: 0,
						display: 'flex',
						flexDirection: 'column',
						overflow: 'hidden',
					}}
				>
					{total !== undefined ? (
						<Typography.Text type="secondary" style={{ marginBottom: 12, flexShrink: 0, fontSize: 13 }}>
							Всего: {total}
						</Typography.Text>
					) : null}
					<div
						style={{
							flex: 1,
							minHeight: 0,
							display: 'flex',
							flexDirection: 'column',
							overflow: 'hidden',
						}}
					>
						{children}
					</div>
				</div>
			)}
		</div>
	);
}
