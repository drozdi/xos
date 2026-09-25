import { Box, Button, Group, SimpleGrid, Stack, Text, UnstyledButton } from '@mantine/core';
import { useEffect } from 'react';

import { useWindowTitle } from '@/core/hooks/useWindowTitle';

import { useMemoryStore } from './store';

export default function MemoryApp() {
	useWindowTitle('Memory');
	const cards = useMemoryStore((s) => s.cards);
	const moves = useMemoryStore((s) => s.moves);
	const won = useMemoryStore((s) => s.won);
	const locked = useMemoryStore((s) => s.locked);
	const flip = useMemoryStore((s) => s.flip);
	const newGame = useMemoryStore((s) => s.newGame);
	const resolveMismatch = useMemoryStore((s) => s.resolveMismatch);
	const flippedIds = useMemoryStore((s) => s.flippedIds);

	useEffect(() => {
		if (!locked || flippedIds.length !== 2) {
			return;
		}
		const id = window.setTimeout(() => resolveMismatch(), 650);
		return () => window.clearTimeout(id);
	}, [locked, flippedIds, resolveMismatch]);

	return (
		<Box p="md" h="100%" style={{ overflow: 'auto' }}>
			<Stack gap="md" align="center">
				<Group>
					<Text fw={600}>Ходы: {moves}</Text>
					<Button size="xs" variant="light" onClick={() => newGame()}>
						Новая игра
					</Button>
				</Group>
				{won ? (
					<Text c="green" fw={600}>
						Все пары найдены!
					</Text>
				) : null}
				<SimpleGrid cols={4} spacing={8} style={{ width: 'min(100%, 360px)' }}>
					{cards.map((card) => {
						const show = card.flipped || card.matched;
						return (
							<UnstyledButton
								key={card.id}
								onClick={() => flip(card.id)}
								disabled={show || locked || won}
								style={{
									aspectRatio: '1',
									borderRadius: 8,
									background: show
										? 'var(--mantine-color-yellow-1)'
										: 'var(--mantine-color-blue-6)',
									border: '1px solid var(--mantine-color-default-border)',
									fontSize: 28,
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
									opacity: card.matched ? 0.55 : 1,
								}}
							>
								{show ? card.symbol : ''}
							</UnstyledButton>
						);
					})}
				</SimpleGrid>
			</Stack>
		</Box>
	);
}
