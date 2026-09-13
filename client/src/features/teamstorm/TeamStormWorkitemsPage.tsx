import {
	Alert,
	Box,
	Button,
	Drawer,
	Group,
	Loader,
	SegmentedControl,
	Select,
	Stack,
	Table,
	Text,
	TextInput,
} from '@mantine/core';
import { Link, RichTextEditor } from '@mantine/tiptap';
import { notifications } from '@mantine/notifications';
import Underline from '@tiptap/extension-underline';
import { useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useEffect, useMemo, useState } from 'react';

import { extractApiErrorMessage } from '@/core/api/apiError';

import {
	useTsWorkitemQuery,
	useTsWorkitemsQuery,
	useTsWorkitemUpdate,
	useTsWorkspacesQuery,
} from './api/queries';
import {
	statusLabel,
	truncateDescription,
	workitemRef,
	workspaceRef,
	type TsWorkitemSummary,
} from './api/tsApi';

function WorkitemEditDrawer({
	workspace,
	workitemId,
	opened,
	onClose,
}: {
	workspace: string;
	workitemId: string | null;
	opened: boolean;
	onClose: () => void;
}) {
	const detailQuery = useTsWorkitemQuery(workspace, workitemId, opened && Boolean(workitemId));
	const updateMutation = useTsWorkitemUpdate();
	const [name, setName] = useState('');
	const [status, setStatus] = useState('');

	const editor = useEditor({
		extensions: [StarterKit, Underline, Link],
		content: '',
		immediatelyRender: false,
	});

	useEffect(() => {
		const item = detailQuery.data;
		if (!item) {
			return;
		}
		setName(item.name || '');
		setStatus(statusLabel(item.status) === '—' ? '' : statusLabel(item.status));
	}, [detailQuery.data]);

	useEffect(() => {
		if (!detailQuery.data || !editor || editor.isDestroyed) {
			return;
		}
		editor.commands.setContent(detailQuery.data.description || '');
	}, [detailQuery.data, editor]);

	useEffect(() => {
		if (!opened && editor && !editor.isDestroyed) {
			editor.commands.clearContent();
		}
	}, [opened, editor]);

	async function handleSave() {
		if (!workitemId) {
			return;
		}
		try {
			await updateMutation.mutateAsync({
				workspace,
				workitem: workitemId,
				payload: {
					name: name.trim(),
					description: editor?.getHTML() ?? '',
					status: status.trim(),
				},
			});
			notifications.show({ color: 'green', message: 'Задача сохранена' });
			onClose();
		} catch (error) {
			notifications.show({
				color: 'red',
				message: extractApiErrorMessage(error) || 'Не удалось сохранить',
			});
		}
	}

	return (
		<Drawer
			opened={opened}
			onClose={onClose}
			title={workitemId ? `Задача ${workitemId}` : 'Задача'}
			position="right"
			size="lg"
		>
			{detailQuery.isLoading ? (
				<Loader size="sm" />
			) : detailQuery.isError ? (
				<Alert color="red">{extractApiErrorMessage(detailQuery.error)}</Alert>
			) : (
				<Stack gap="sm">
					<TextInput label="Название" value={name} onChange={(e) => setName(e.currentTarget.value)} />
					<Box>
						<Text size="sm" fw={500} mb={6}>
							Описание
						</Text>
						<RichTextEditor editor={editor}>
							<RichTextEditor.Toolbar sticky stickyOffset={0}>
								<RichTextEditor.ControlsGroup>
									<RichTextEditor.Bold />
									<RichTextEditor.Italic />
									<RichTextEditor.Underline />
									<RichTextEditor.Strikethrough />
									<RichTextEditor.ClearFormatting />
								</RichTextEditor.ControlsGroup>
								<RichTextEditor.ControlsGroup>
									<RichTextEditor.H2 />
									<RichTextEditor.H3 />
									<RichTextEditor.BulletList />
									<RichTextEditor.OrderedList />
								</RichTextEditor.ControlsGroup>
								<RichTextEditor.ControlsGroup>
									<RichTextEditor.Link />
									<RichTextEditor.Unlink />
								</RichTextEditor.ControlsGroup>
								<RichTextEditor.ControlsGroup>
									<RichTextEditor.Undo />
									<RichTextEditor.Redo />
								</RichTextEditor.ControlsGroup>
							</RichTextEditor.Toolbar>
							<RichTextEditor.Content mih={220} />
						</RichTextEditor>
					</Box>
					<TextInput
						label="Статус"
						description="Имя или id статуса в TeamStorm"
						value={status}
						onChange={(e) => setStatus(e.currentTarget.value)}
					/>
					<Group>
						<Button loading={updateMutation.isPending} onClick={() => void handleSave()}>
							Сохранить
						</Button>
						<Button variant="default" onClick={onClose}>
							Отмена
						</Button>
					</Group>
				</Stack>
			)}
		</Drawer>
	);
}

export function TeamStormWorkitemsPage() {
	const workspacesQuery = useTsWorkspacesQuery(true);
	const [workspace, setWorkspace] = useState<string | null>(null);
	const [pageToken, setPageToken] = useState<string | null>(null);
	const [tokenStack, setTokenStack] = useState<(string | null)[]>([null]);
	const [selected, setSelected] = useState<string | null>(null);
	const [scope, setScope] = useState<'mine' | 'all'>('mine');
	const mine = scope === 'mine';

	const workitemsQuery = useTsWorkitemsQuery(workspace, pageToken, mine, Boolean(workspace));

	const workspaceOptions = useMemo(() => {
		const list = workspacesQuery.data ?? [];
		return list
			.map((ws) => {
				const value = workspaceRef(ws);
				if (!value) {
					return null;
				}
				return { value, label: ws.name ? `${ws.name} (${value})` : value };
			})
			.filter((x): x is { value: string; label: string } => x !== null);
	}, [workspacesQuery.data]);

	useEffect(() => {
		if (!workspace && workspaceOptions.length === 1) {
			setWorkspace(workspaceOptions[0].value);
		}
	}, [workspace, workspaceOptions]);

	const items: TsWorkitemSummary[] = workitemsQuery.data?.items ?? [];
	const nextToken = workitemsQuery.data?.nextToken || null;

	function openItem(item: TsWorkitemSummary) {
		const ref = workitemRef(item);
		if (ref) {
			setSelected(ref);
		}
	}

	function goNext() {
		if (!nextToken) {
			return;
		}
		setTokenStack((prev) => [...prev, nextToken]);
		setPageToken(nextToken);
	}

	function goPrev() {
		if (tokenStack.length <= 1) {
			return;
		}
		const nextStack = tokenStack.slice(0, -1);
		setTokenStack(nextStack);
		setPageToken(nextStack[nextStack.length - 1] ?? null);
	}

	return (
		<Stack gap="md" p="md" style={{ minHeight: 0, flex: 1 }}>
			<Group align="flex-end" grow preventGrowOverflow={false} wrap="wrap">
				<Select
					label="Пространство"
					placeholder="Выберите workspace"
					data={workspaceOptions}
					value={workspace}
					onChange={(value) => {
						setWorkspace(value);
						setPageToken(null);
						setTokenStack([null]);
						setSelected(null);
					}}
					searchable
					disabled={workspacesQuery.isLoading}
					style={{ flex: 1, minWidth: 220 }}
				/>
				<SegmentedControl
					value={scope}
					onChange={(value) => {
						setScope(value as 'mine' | 'all');
						setPageToken(null);
						setTokenStack([null]);
					}}
					data={[
						{ label: 'Мои', value: 'mine' },
						{ label: 'Все', value: 'all' },
					]}
				/>
			</Group>
			{mine ? (
				<Text size="sm" c="dimmed">
					Показаны задачи, где вы assignee/responsible (логин TS или email/login XOS).
				</Text>
			) : null}
			{workspacesQuery.isError ? (
				<Alert color="red">{extractApiErrorMessage(workspacesQuery.error)}</Alert>
			) : null}
			{!workspace ? (
				<Text size="sm" c="dimmed">
					Выберите пространство, чтобы загрузить задачи.
				</Text>
			) : workitemsQuery.isLoading ? (
				<Loader size="sm" />
			) : workitemsQuery.isError ? (
				<Alert color="red">{extractApiErrorMessage(workitemsQuery.error)}</Alert>
			) : (
				<>
					<Table striped highlightOnHover withTableBorder>
						<Table.Thead>
							<Table.Tr>
								<Table.Th>Ключ</Table.Th>
								<Table.Th>Название</Table.Th>
								<Table.Th>Описание</Table.Th>
								<Table.Th>Статус</Table.Th>
								<Table.Th>Исполнитель</Table.Th>
							</Table.Tr>
						</Table.Thead>
						<Table.Tbody>
							{items.length === 0 ? (
								<Table.Tr>
									<Table.Td colSpan={5}>
										<Text c="dimmed" size="sm">
											{mine
												? 'Нет задач, привязанных к вам (проверьте логин TS на вкладке «Связь»)'
												: 'Нет задач'}
										</Text>
									</Table.Td>
								</Table.Tr>
							) : (
								items.map((item) => {
									const ref = workitemRef(item);
									return (
										<Table.Tr
											key={ref || item.name}
											style={{ cursor: ref ? 'pointer' : undefined }}
											onClick={() => openItem(item)}
										>
											<Table.Td>{item.key || item.id || '—'}</Table.Td>
											<Table.Td>{item.name || '—'}</Table.Td>
											<Table.Td style={{ maxWidth: 280 }}>
												<Text size="sm" lineClamp={2}>
													{truncateDescription(item.description)}
												</Text>
											</Table.Td>
											<Table.Td>{statusLabel(item.status)}</Table.Td>
											<Table.Td>
												{item.assignee?.displayName ||
													item.assignee?.username ||
													'—'}
											</Table.Td>
										</Table.Tr>
									);
								})
							)}
						</Table.Tbody>
					</Table>
					<Group>
						<Button
							variant="default"
							disabled={tokenStack.length <= 1}
							onClick={goPrev}
						>
							Назад
						</Button>
						<Button variant="light" disabled={!nextToken} onClick={goNext}>
							Ещё
						</Button>
					</Group>
				</>
			)}
			{workspace ? (
				<WorkitemEditDrawer
					workspace={workspace}
					workitemId={selected}
					opened={Boolean(selected)}
					onClose={() => setSelected(null)}
				/>
			) : null}
		</Stack>
	);
}
