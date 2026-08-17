import { Paper, ScrollArea, Stack, Text, UnstyledButton } from '@mantine/core';
import { useMemo } from 'react';

import { filterNotesByTitle } from './wikilinkHelpers';
import type { WikilinkAutocompleteState, WikilinkSuggestion } from './wikilinkExtension';

interface WikilinkAutocompleteMenuProps {
	state: WikilinkAutocompleteState;
	suggestions: WikilinkSuggestion[];
	onSelect: (suggestion: WikilinkSuggestion) => void;
}

export function WikilinkAutocompleteMenu({
	state,
	suggestions,
	onSelect,
}: WikilinkAutocompleteMenuProps) {
	const filtered = useMemo(
		() => filterNotesByTitle(suggestions, state.query),
		[suggestions, state.query],
	);

	if (!state.clientRect || filtered.length === 0) {
		return null;
	}

	const { clientRect, selectedIndex } = state;

	return (
		<Paper
			shadow="md"
			withBorder
			p={4}
			style={{
				position: 'fixed',
				top: clientRect.bottom + 4,
				left: clientRect.left,
				zIndex: 200,
				width: 280,
				maxWidth: 'calc(100vw - 16px)',
			}}
		>
			<ScrollArea.Autosize mah={220} type="auto">
				<Stack gap={2}>
					{filtered.map((item, index) => (
						<UnstyledButton
							key={item.path}
							onMouseDown={(event) => {
								event.preventDefault();
								onSelect(item);
							}}
							px="xs"
							py={6}
							style={{
								borderRadius: 'var(--mantine-radius-sm)',
								background:
									index === selectedIndex
										? 'var(--mantine-color-blue-light)'
										: undefined,
							}}
						>
							<Text size="sm" fw={500} lineClamp={1}>
								{item.title}
							</Text>
							<Text size="xs" c="dimmed" lineClamp={1}>
								{item.path}
							</Text>
						</UnstyledButton>
					))}
				</Stack>
			</ScrollArea.Autosize>
		</Paper>
	);
}
