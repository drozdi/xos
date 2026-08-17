import { Box, Loader, Paper, Stack, Text, TextInput } from '@mantine/core';
import { IconSearch } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { useDebouncedValue } from '@mantine/hooks';
import { useState } from 'react';

import { pkbApi } from '@/core/api/endpoints/pkbApi';
import { queryKeys } from '@/core/api/queryKeys';

interface VaultSearchBarProps {
	vaultId: number;
	onNavigateNote: (path: string) => void;
}

export function VaultSearchBar({ vaultId, onNavigateNote }: VaultSearchBarProps) {
	const [query, setQuery] = useState('');
	const [debouncedQuery] = useDebouncedValue(query.trim(), 300);
	const [focused, setFocused] = useState(false);

	const searchQuery = useQuery({
		queryKey: queryKeys.pkb.search(vaultId, debouncedQuery),
		queryFn: () => pkbApi.search(vaultId, debouncedQuery),
		enabled: debouncedQuery.length >= 2,
	});

	const showResults = focused && debouncedQuery.length >= 2;
	const results = searchQuery.data?.results ?? [];

	return (
		<Box pos="relative" style={{ minWidth: 220, maxWidth: 360, flex: 1 }}>
			<TextInput
				size="xs"
				placeholder="Поиск по vault…"
				leftSection={<IconSearch size={14} />}
				value={query}
				onChange={(event) => setQuery(event.currentTarget.value)}
				onFocus={() => setFocused(true)}
				onBlur={() => {
					window.setTimeout(() => setFocused(false), 150);
				}}
			/>

			{showResults ? (
				<Paper
					shadow="md"
					withBorder
					p="xs"
					pos="absolute"
					top="100%"
					left={0}
					right={0}
					mt={4}
					style={{ zIndex: 20, maxHeight: 280, overflow: 'auto' }}
				>
					{searchQuery.isLoading ? (
						<GroupLoader />
					) : results.length === 0 ? (
						<Text size="xs" c="dimmed" ta="center" py="xs">
							Ничего не найдено
						</Text>
					) : (
						<Stack gap={4}>
							{results.map((result) => (
								<Box
									key={result.path}
									p={6}
									style={{ cursor: 'pointer', borderRadius: 4 }}
									onMouseDown={(event) => {
										event.preventDefault();
										onNavigateNote(result.path);
										setQuery('');
										setFocused(false);
									}}
									className="pkb-search-result"
								>
									<Text size="sm" fw={500} lineClamp={1}>
										{result.title}
									</Text>
									{result.excerpt ? (
										<Text size="xs" c="dimmed" lineClamp={2}>
											{result.excerpt}
										</Text>
									) : null}
								</Box>
							))}
						</Stack>
					)}
				</Paper>
			) : null}
		</Box>
	);
}

function GroupLoader() {
	return (
		<Box ta="center" py="xs">
			<Loader size="xs" />
		</Box>
	);
}
