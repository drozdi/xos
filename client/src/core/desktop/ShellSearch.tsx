import { Modal, Stack, Text, TextInput, UnstyledButton } from '@mantine/core';
import { useEffect, useState } from 'react';

import { useAppManager } from '@/core/appManager';
import { AppRegistry } from '@/core/appManager/AppRegistry';
import { boardApi } from '@/core/api/endpoints/boardApi';
import { pkbApi } from '@/core/api/endpoints/pkbApi';
import { todoApi } from '@/core/api/endpoints/todoApi';
import { canUseBoard } from '@/features/board/boardAccess';
import { fetchExplorerList } from '@/features/explorer/explorerApi';
import { canReadExplorer } from '@/features/explorer/explorerAccess';
import { canUsePkb } from '@/features/pkb/pkbAccess';
import { canUseTodo } from '@/features/todo/todoAccess';

type Hit = { id: string; label: string; hint: string; open: () => void };

export function ShellSearch() {
	const launchApp = useAppManager((s) => s.launchApp);
	const [opened, setOpened] = useState(false);
	const [query, setQuery] = useState('');
	const [hits, setHits] = useState<Hit[]>([]);

	useEffect(() => {
		const onKey = (event: KeyboardEvent) => {
			if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
				event.preventDefault();
				setOpened(true);
			}
		};
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	}, []);

	useEffect(() => {
		const q = query.trim();
		if (!opened || q.length < 2) {
			setHits([]);
			return;
		}
		let cancelled = false;
		const timer = window.setTimeout(() => {
			void (async () => {
				const next: Hit[] = [];
				const needle = q.toLocaleLowerCase('ru');
				for (const app of AppRegistry.getAvailable()) {
					if (app.startMenu === false || app.shellRole === 'widget') {
						continue;
					}
					if (!app.name.toLocaleLowerCase('ru').includes(needle)) {
						continue;
					}
					next.push({
						id: `app:${app.id}`,
						label: app.name,
						hint: 'Приложение',
						open: () => void launchApp(app.id),
					});
				}
				if (canUseTodo()) {
					try {
						const lists = await todoApi.lists();
						for (const list of lists) {
							if (!list.title.toLocaleLowerCase('ru').includes(needle)) {
								continue;
							}
							next.push({
								id: `todo:${list.id}`,
								label: list.title,
								hint: 'Задачи',
								open: () => void launchApp('todo', { props: { listId: list.id } }),
							});
						}
					} catch {
						/* module unavailable */
					}
				}
				if (canUseBoard()) {
					try {
						const found = await boardApi.search(q, 8);
						for (const card of found.cards) {
							next.push({
								id: `board:${card.id}`,
								label: card.title,
								hint: card.board_title || 'Доска',
								open: () =>
									void launchApp('board', {
										props: { boardId: card.board_id ?? undefined },
									}),
							});
						}
					} catch {
						/* module unavailable */
					}
				}
				if (canUsePkb()) {
					try {
						const vaults = await pkbApi.vaults();
						const vault = vaults[0];
						if (vault) {
							const found = await pkbApi.search(vault.id, q);
							for (const note of found.results.slice(0, 8)) {
								next.push({
									id: `pkb:${note.path}`,
									label: note.title || note.path,
									hint: 'База знаний',
									open: () => void launchApp('pkb', { props: { path: note.path } }),
								});
							}
						}
					} catch {
						/* module unavailable */
					}
				}
				if (canReadExplorer()) {
					try {
						const listed = await fetchExplorerList('home://');
						for (const item of listed.items) {
							if (!item.name.toLocaleLowerCase('ru').includes(needle)) {
								continue;
							}
							const path = item.path || `home://${item.relativePath}`;
							next.push({
								id: `file:${path}`,
								label: item.name,
								hint: path,
								open: () => void launchApp('explorer', { props: { path } }),
							});
						}
					} catch {
						/* module unavailable */
					}
				}
				if (!cancelled) {
					setHits(next.slice(0, 30));
				}
			})();
		}, 250);
		return () => {
			cancelled = true;
			window.clearTimeout(timer);
		};
	}, [launchApp, opened, query]);

	return (
		<Modal
			opened={opened}
			onClose={() => setOpened(false)}
			title="Поиск"
			centered
			size="md"
		>
			<Stack gap="xs">
				<TextInput
					placeholder="Задачи, карточки, заметки, файлы"
					value={query}
					onChange={(event) => setQuery(event.currentTarget.value)}
					autoFocus
				/>
				{hits.length === 0 ? (
					<Text size="sm" c="dimmed">
						Ctrl+K. Минимум 2 символа.
					</Text>
				) : (
					hits.map((hit) => (
						<UnstyledButton
							key={hit.id}
							onClick={() => {
								hit.open();
								setOpened(false);
							}}
							style={{ padding: '6px 4px' }}
						>
							<Text size="sm">{hit.label}</Text>
							<Text size="xs" c="dimmed">
								{hit.hint}
							</Text>
						</UnstyledButton>
					))
				)}
			</Stack>
		</Modal>
	);
}
