import { Box, Loader, Paper, Stack, Text, TextInput, UnstyledButton } from '@mantine/core';
import { IconSearch } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

import { type BoardSearchCard, boardApi } from '@/core/api/endpoints/boardApi';
import { queryKeys } from '@/core/api/queryKeys';

interface BoardGlobalSearchProps {
	onOpenCard: (boardId: number, cardId: number) => void;
}

export function BoardGlobalSearch({ onOpenCard }: BoardGlobalSearchProps) {
	const [q, setQ] = useState('');
	const [debounced, setDebounced] = useState('');
	const [open, setOpen] = useState(false);

	useEffect(() => {
		const timer = window.setTimeout(() => setDebounced(q.trim()), 250);
		return () => window.clearTimeout(timer);
	}, [q]);

	const searchQuery = useQuery({
		queryKey: queryKeys.board.search(debounced),
		queryFn: () => boardApi.search(debounced),
		enabled: debounced.length >= 2,
	});

	const cards = searchQuery.data?.cards ?? [];
	const showDropdown = open && debounced.length >= 2;

	const handleSelect = (card: BoardSearchCard) => {
		if (card.board_id == null) {
			return;
		}
		setOpen(false);
		setQ('');
		setDebounced('');
		onOpenCard(card.board_id, card.id);
	};

	return (
		<Box pos="relative" style={{ flex: 1, maxWidth: 360 }}>
			<TextInput
				placeholder="Поиск карточек…"
				leftSection={<IconSearch size={16} />}
				value={q}
				onChange={(e) => {
					setQ(e.currentTarget.value);
					setOpen(true);
				}}
				onFocus={() => setOpen(true)}
				onBlur={() => {
					window.setTimeout(() => setOpen(false), 150);
				}}
				rightSection={searchQuery.isFetching ? <Loader size={14} /> : null}
				size="sm"
			/>
			{showDropdown && (
				<Paper
					withBorder
					shadow="sm"
					pos="absolute"
					top="100%"
					left={0}
					right={0}
					mt={4}
					p="xs"
					style={{ zIndex: 20, maxHeight: 280, overflow: 'auto' }}
				>
					{searchQuery.isError && (
						<Text size="sm" c="red">
							Ошибка поиска
						</Text>
					)}
					{!searchQuery.isError && cards.length === 0 && !searchQuery.isFetching && (
						<Text size="sm" c="dimmed">
							Ничего не найдено
						</Text>
					)}
					<Stack gap={4}>
						{cards.map((card) => (
							<UnstyledButton
								key={card.id}
								onMouseDown={(e) => e.preventDefault()}
								onClick={() => handleSelect(card)}
								p="xs"
								style={{ borderRadius: 4, textAlign: 'left' }}
							>
								<Text size="sm" fw={500} lineClamp={1}>
									{card.title}
								</Text>
								<Text size="xs" c="dimmed" lineClamp={1}>
									{[card.workspace_name, card.board_title, card.list_title]
										.filter(Boolean)
										.join(' · ')}
								</Text>
							</UnstyledButton>
						))}
					</Stack>
				</Paper>
			)}
		</Box>
	);
}
