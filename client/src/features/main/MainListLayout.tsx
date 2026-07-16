import {
	Alert,
	Box,
	Button,
	Group,
	Loader,
	ScrollArea,
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
		<ScrollArea h="100%" p="md">
			<Group justify="space-between" mb="md" wrap="nowrap">
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

			{filters ? <Box mb="md">{filters}</Box> : null}

			{isLoading ? (
				<Group justify="center" py="xl">
					<Loader size="sm" />
				</Group>
			) : isError ? (
				<Alert color="red" title="Ошибка">
					{errorMessage ?? 'Не удалось загрузить данные'}
				</Alert>
			) : (
				<>
					{total !== undefined ? (
						<Text size="sm" c="dimmed" mb="sm">
							Всего: {total}
						</Text>
					) : null}
					{children}
				</>
			)}
		</ScrollArea>
	);
}
