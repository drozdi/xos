import { Box, Stack, Text } from '@mantine/core';
import { useEffect, useState } from 'react';

import { useAppManager } from '@/core/appManager';
import { WidgetBody, WidgetSkeleton } from '@/core/desktop/WidgetSurface';
import { useWindowTitle } from '@/core/hooks/useWindowTitle';
import { listGithubIssues } from '@/features/github/api/githubApi';
import { listTsWorkitems, listTsWorkspaces } from '@/features/teamstorm/api/tsApi';

type Row = { id: string; label: string; appId: string };

export default function WidgetExternalApp() {
	useWindowTitle('Внешние задачи');
	const launchApp = useAppManager((s) => s.launchApp);
	const [rows, setRows] = useState<Row[]>([]);
	const [ready, setReady] = useState(false);

	useEffect(() => {
		void (async () => {
			const next: Row[] = [];
			try {
				const issues = await listGithubIssues({ per_page: 5, state: 'open' });
				for (const issue of issues.slice(0, 5)) {
					next.push({
						id: `gh:${issue.number ?? issue.title}`,
						label: issue.title || 'Issue',
						appId: 'github',
					});
				}
			} catch {
				/* no credentials */
			}
			try {
				const spaces = await listTsWorkspaces();
				const space = spaces[0];
				const key = space?.id || space?.key || '';
				if (key) {
					const page = await listTsWorkitems(key, { mine: true, maxItemsCount: 5 });
					for (const item of page.items ?? []) {
						next.push({
							id: `ts:${item.id ?? item.name}`,
							label: item.name || item.key || 'Задача',
							appId: 'teamstorm',
						});
					}
				}
			} catch {
				/* no credentials */
			}
			setRows(next);
			setReady(true);
		})();
	}, []);

	return (
		<WidgetBody>
			{!ready ? (
				<WidgetSkeleton />
			) : (
				<Box p={10}>
					<Stack gap={4}>
						{rows.length === 0 ? (
							<Text size="xs" c="dimmed">
								Нет связи с GitHub или TeamStorm
							</Text>
						) : (
							rows.map((row) => (
								<Text
									key={row.id}
									size="xs"
									style={{ cursor: 'pointer' }}
									onClick={() => void launchApp(row.appId)}
								>
									{row.label}
								</Text>
							))
						)}
					</Stack>
				</Box>
			)}
		</WidgetBody>
	);
}
