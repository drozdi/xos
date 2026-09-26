import {
	Alert,
	Button,
	Drawer,
	Group,
	Loader,
	SegmentedControl,
	Stack,
	Table,
	Text,
	Textarea,
	TextInput,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useEffect, useState } from 'react';

import { extractApiErrorMessage } from '@/core/api/apiError';

import {
	useGithubCredentialsQuery,
	useGithubIssueQuery,
	useGithubIssuesQuery,
	useGithubIssueUpdate,
} from './api/queries';

function IssueEditDrawer({
	number,
	owner,
	repo,
	opened,
	onClose,
}: {
	number: number | null;
	owner: string;
	repo: string;
	opened: boolean;
	onClose: () => void;
}) {
	const detailQuery = useGithubIssueQuery(number, owner, repo, opened && Boolean(number));
	const updateMutation = useGithubIssueUpdate();
	const [title, setTitle] = useState('');
	const [body, setBody] = useState('');
	const [state, setState] = useState('open');

	useEffect(() => {
		const item = detailQuery.data;
		if (!item) {
			return;
		}
		setTitle(item.title || '');
		setBody(item.body || '');
		setState(item.state || 'open');
	}, [detailQuery.data]);

	async function handleSave() {
		if (!number) {
			return;
		}
		try {
			await updateMutation.mutateAsync({
				number,
				payload: {
					title: title.trim(),
					body,
					state,
					owner,
					repo,
				},
			});
			notifications.show({ color: 'green', message: 'Issue сохранён' });
			onClose();
		} catch (error) {
			notifications.show({
				color: 'red',
				message: extractApiErrorMessage(error) || 'Не удалось сохранить',
			});
		}
	}

	return (
		<Drawer opened={opened} onClose={onClose} title={number ? `#${number}` : 'Issue'} position="right" size="lg">
			{detailQuery.isLoading ? (
				<Loader />
			) : (
				<Stack gap="sm">
					<TextInput label="Title" value={title} onChange={(e) => setTitle(e.currentTarget.value)} />
					<SegmentedControl
						value={state}
						onChange={setState}
						data={[
							{ value: 'open', label: 'Open' },
							{ value: 'closed', label: 'Closed' },
						]}
					/>
					<Textarea
						label="Body"
						minRows={8}
						autosize
						value={body}
						onChange={(e) => setBody(e.currentTarget.value)}
					/>
					<Button onClick={() => void handleSave()} loading={updateMutation.isPending}>
						Сохранить
					</Button>
				</Stack>
			)}
		</Drawer>
	);
}

export function GithubIssuesPage() {
	const credentialsQuery = useGithubCredentialsQuery();
	const owner = credentialsQuery.data?.default_owner || '';
	const repo = credentialsQuery.data?.default_repo || '';
	const [state, setState] = useState('open');
	const [selected, setSelected] = useState<number | null>(null);
	const issuesQuery = useGithubIssuesQuery(owner, repo, state, Boolean(owner && repo));

	if (!owner || !repo) {
		return (
			<Alert m="md" color="yellow">
				Укажите default owner/repo на вкладке «Связь».
			</Alert>
		);
	}

	return (
		<Stack m="md" gap="md" style={{ minHeight: 0 }}>
			<Group justify="space-between">
				<Text fw={600}>
					{owner}/{repo}
				</Text>
				<SegmentedControl
					value={state}
					onChange={setState}
					data={[
						{ value: 'open', label: 'Open' },
						{ value: 'closed', label: 'Closed' },
						{ value: 'all', label: 'All' },
					]}
				/>
			</Group>
			{issuesQuery.isLoading ? (
				<Loader />
			) : issuesQuery.isError ? (
				<Alert color="red">{extractApiErrorMessage(issuesQuery.error)}</Alert>
			) : (
				<Table striped highlightOnHover>
					<Table.Thead>
						<Table.Tr>
							<Table.Th style={{ width: 70 }}>#</Table.Th>
							<Table.Th>Title</Table.Th>
							<Table.Th style={{ width: 90 }}>State</Table.Th>
						</Table.Tr>
					</Table.Thead>
					<Table.Tbody>
						{(issuesQuery.data ?? []).map((issue) => (
							<Table.Tr
								key={issue.id ?? issue.number}
								style={{ cursor: 'pointer' }}
								onClick={() => setSelected(issue.number ?? null)}
							>
								<Table.Td>{issue.number}</Table.Td>
								<Table.Td>{issue.title}</Table.Td>
								<Table.Td>{issue.state}</Table.Td>
							</Table.Tr>
						))}
					</Table.Tbody>
				</Table>
			)}
			<IssueEditDrawer
				number={selected}
				owner={owner}
				repo={repo}
				opened={selected != null}
				onClose={() => setSelected(null)}
			/>
		</Stack>
	);
}
