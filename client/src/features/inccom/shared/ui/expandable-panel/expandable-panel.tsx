import {
	Box,
	Button,
	Group,
	LoadingOverlay,
	Paper,
	Text,
	type PaperProps,
} from '@mantine/core';
import { useState } from 'react';
import { TbArrowsMaximize, TbArrowsMinimize } from 'react-icons/tb';

export function ExpandablePanel({
	title,
	loading = false,
	children,
	keepMounted = true,
	component,
	...otherProps
}: PaperProps & {
	title: string;
	loading?: boolean;
	keepMounted?: boolean;
	children: React.ReactNode;
	component?: any;
}) {
	// Управляем состоянием компонента
	const [isExpanded, setIsExpanded] = useState(false);

	// Обработчик переключения состояния
	const toggleExpanded = () => {
		setIsExpanded((v) => !v);
	};

	return (
		<Paper
			shadow="xl"
			p="xs"
			{...otherProps}
			style={{
				position: isExpanded ? 'fixed' : 'relative',
				top: isExpanded ? 0 : 'auto',
				left: isExpanded ? 0 : 'auto',
				width: isExpanded ? '100vw' : '100%',
				height: isExpanded ? '100vh' : 'auto',
				zIndex: isExpanded ? 'calc(var(--mantine-z-index-app) + 10)' : 1,
				overflow: 'auto',
			}}
		>
			<LoadingOverlay visible={loading} zIndex={1000} />
			<Group justify="space-between" mb="xs">
				<Text fw={500}>{title}</Text>
				<Button
					variant="subtle"
					size="compact-xs"
					onClick={toggleExpanded}
					rightSection={
						isExpanded ? (
							<TbArrowsMinimize size="1rem" />
						) : (
							<TbArrowsMaximize size="1rem" />
						)
					}
				>
					{isExpanded ? 'Свернуть' : 'Развернуть'}
				</Button>
			</Group>

			{/* Содержимое компонента */}
			{(keepMounted || isExpanded) && (
				<Box
					component={component}
					mih={loading ? 300 : undefined}
					miw={loading ? 300 : undefined}
				>
					{children}
				</Box>
			)}
		</Paper>
	);
}
