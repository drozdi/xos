import { Alert, Tabs } from '@mantine/core';

import { useWindowTitle } from '@/core/hooks/useWindowTitle';
import { useGithubCredentialsQuery } from '@/features/github/api/queries';
import { canUseGithub } from '@/features/github/githubAccess';
import { GithubConnectionPage } from '@/features/github/GithubConnectionPage';
import { GithubIssuesPage } from '@/features/github/GithubIssuesPage';

export default function GithubApp() {
	useWindowTitle('GitHub');
	const credentialsQuery = useGithubCredentialsQuery();
	const configured = Boolean(credentialsQuery.data?.configured);

	if (!canUseGithub()) {
		return (
			<Alert color="red" title="Доступ запрещён" m="md">
				Нужна роль ROLE_GITHUB (вкладка «Доступ к приложениям» → GitHub).
			</Alert>
		);
	}

	return (
		<div
			style={{
				position: 'absolute',
				inset: 0,
				display: 'flex',
				flexDirection: 'column',
				minHeight: 0,
			}}
		>
			<Tabs defaultValue="connection" style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
				<Tabs.List px="md" pt="sm">
					<Tabs.Tab value="connection">Связь</Tabs.Tab>
					<Tabs.Tab value="issues" disabled={!configured}>
						Issues
					</Tabs.Tab>
				</Tabs.List>
				<Tabs.Panel value="connection" style={{ flex: 1, overflow: 'auto' }}>
					<GithubConnectionPage />
				</Tabs.Panel>
				<Tabs.Panel value="issues" style={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
					{configured ? (
						<GithubIssuesPage />
					) : (
						<Alert m="md" color="yellow">
							Сначала сохраните PAT и repo на вкладке «Связь».
						</Alert>
					)}
				</Tabs.Panel>
			</Tabs>
		</div>
	);
}
