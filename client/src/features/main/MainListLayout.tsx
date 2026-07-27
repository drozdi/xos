import {
	Alert,
	Box,
	Button,
	Group,
	Loader,
	Text,
} from '@mantine/core';
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
		<Box
			style={{
				position: 'absolute',
				inset: 0,
				display: 'flex',
				flexDirection: 'column',
				minHeight: 0,
				overflow: 'hidden',
				padding: 'var(--mantine-spacing-md)',
			}}
		>
			<Group justify="space-between" mb="md" wrap="nowrap" style={{ flexShrink: 0 }}>
				<Text fw={600}>{title}</Text>
				<Group gap="xs" wrap="nowrap">
					{onCreate ? (
						<Button variant="filled" size="xs" onClick={onCreate}>
							{createLabel}
						</Button>
					) : null}
					<Button
						variant="light"
						size="xs"
						onClick={onRefresh}
						loading={Boolean(isFetching && !isLoading)}
					>
						Обновить
					</Button>
				</Group>
			</Group>

			{filters ? <Box mb="md" style={{ flexShrink: 0 }}>{filters}</Box> : null}

			{isLoading ? (
				<Group justify="center" py="xl">
					<Loader size="sm" />
				</Group>
			) : isError ? (
				<Alert color="red" title="Ошибка">
					{errorMessage ?? 'Не удалось загрузить данные'}
				</Alert>
			) : (
				<Box
					style={{
						flex: 1,
						minHeight: 0,
						display: 'flex',
						flexDirection: 'column',
						overflow: 'hidden',
					}}
				>
					{total !== undefined ? (
						<Text size="sm" c="dimmed" mb="sm" style={{ flexShrink: 0 }}>
							Всего: {total}
						</Text>
					) : null}
					<Box
						style={{
							flex: 1,
							minHeight: 0,
							display: 'flex',
							flexDirection: 'column',
							overflow: 'hidden',
						}}
					>
						{children}
					</Box>
				</Box>
			)}
		</Box>
	);
}
