import {
	ActionIcon,
	Alert,
	Button,
	Checkbox,
	Group,
	Modal,
	MultiSelect,
	Select,
	Stack,
	Table,
	Tabs,
	TextInput,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconPlus, IconTrash } from '@tabler/icons-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';

import { extractApiErrorMessage, notifyApiError } from '@/core/api/apiError';
import {
	schooltaskClassApi,
	schooltaskParallelApi,
	type ClassDetail,
} from '@/core/api/endpoints/schooltaskApi';
import { queryKeys } from '@/core/api/queryKeys';
import { MainEntityForm } from '@/features/main/MainEntityForm';
import {
	canCreateSchooltaskClass,
	useCanDeleteSchooltaskClass,
	useCanReadSchooltaskClass,
	useCanUpdateSchooltaskClass,
	useCanUpdateSchooltaskZam,
} from '@/features/schooltask/schooltaskAccess';
import { useEntityId } from '@/features/schooltask/schooltaskAppUtils';

import {
	PARALLEL_NAME_EXISTS,
	addSubGroup,
	getInvalidSubGroupIndexes,
	isParallelNameTaken,
	normalizeClassUsers,
	prepareClassSavePayload,
	removeSubGroup,
	updateSubGroup,
	validateClassForm,
} from './classFormUtils';

const initialData: ClassDetail = {
	id: 0,
	name: '',
	parent_id: null,
	user_id: null,
	users: [],
	sub: [],
};

const classNamesListRequest = {
	offset: 1,
	limit: 1000,
	filters: { graduated: true },
} as const;

export default function SchooltaskClassApp() {
	const entityId = useEntityId();
	const queryClient = useQueryClient();
	const canRead = useCanReadSchooltaskClass();
	const canUpdate = useCanUpdateSchooltaskClass();
	const canUpdateZam = useCanUpdateSchooltaskZam();
	const canDelete = useCanDeleteSchooltaskClass();
	const canCreate = canCreateSchooltaskClass();
	const isNew = entityId === 0;
	const [activeTab, setActiveTab] = useState<string | null>('general');
	const [parallelModalOpen, setParallelModalOpen] = useState(false);
	const [newParallelName, setNewParallelName] = useState('');
	const [newParallelGraduates, setNewParallelGraduates] = useState(false);
	const [parallelNameError, setParallelNameError] = useState<string | null>(null);
	const [onParallelCreated, setOnParallelCreated] = useState<((parentId: number) => void) | null>(
		null,
	);

	const parallelsQuery = useQuery({
		queryKey: queryKeys.schooltask.classParallels,
		queryFn: () => schooltaskClassApi.parallelsOptions(),
	});
	const tutorsQuery = useQuery({
		queryKey: queryKeys.schooltask.classTutors,
		queryFn: () => schooltaskClassApi.tutorsOptions(),
	});
	const pupilsQuery = useQuery({
		queryKey: queryKeys.schooltask.classPupils,
		queryFn: () => schooltaskClassApi.pupilsOptions(),
	});
	const subjectsQuery = useQuery({
		queryKey: queryKeys.schooltask.classSubjects,
		queryFn: () => schooltaskClassApi.subjectsOptions(),
	});
	const classNamesQuery = useQuery({
		queryKey: queryKeys.schooltask.classes(classNamesListRequest),
		queryFn: () => schooltaskClassApi.list(classNamesListRequest),
		enabled: canRead || canCreate,
	});

	const parallelOptions = useMemo(
		() =>
			(parallelsQuery.data ?? []).map((item) => ({
				value: String(item.value),
				label: item.text ?? String(item.value),
			})),
		[parallelsQuery.data],
	);
	const tutorOptions = useMemo(
		() =>
			(tutorsQuery.data ?? []).map((item) => ({
				value: String(item.value),
				label: item.text ?? String(item.value),
			})),
		[tutorsQuery.data],
	);
	const pupilOptions = useMemo(
		() =>
			(pupilsQuery.data ?? []).map((item) => ({
				value: String(item.value),
				label: item.text ?? String(item.value),
			})),
		[pupilsQuery.data],
	);
	const subjectOptions = useMemo(
		() =>
			(subjectsQuery.data ?? []).map((item) => ({
				value: String(item.value),
				label: item.text ?? String(item.value),
			})),
		[subjectsQuery.data],
	);
	const existingClasses = useMemo(
		() =>
			(classNamesQuery.data?.items ?? []).map((item) => ({
				id: item.id,
				name: item.name,
			})),
		[classNamesQuery.data?.items],
	);

	const createParallelMutation = useMutation({
		mutationFn: (payload: { name: string; graduates: boolean }) =>
			schooltaskParallelApi.create(payload),
		onSuccess: async (parallel) => {
			notifications.show({ message: 'Параллель создана', color: 'green' });
			await queryClient.invalidateQueries({ queryKey: queryKeys.schooltask.classParallels });
			onParallelCreated?.(parallel.id);
			setParallelModalOpen(false);
			setNewParallelName('');
			setNewParallelGraduates(false);
			setParallelNameError(null);
			setOnParallelCreated(null);
		},
		onError: (error) => {
			const message = extractApiErrorMessage(error, 'Ошибка создания параллели');
			setParallelNameError(message);
			notifyApiError(error, 'Ошибка создания параллели');
		},
	});

	const canSave = isNew ? canCreate : canUpdate;
	const canCreateParallel = canCreate || canUpdate;

	const submitNewParallel = () => {
		const name = newParallelName.trim();
		if (!name) {
			setParallelNameError('Укажите название');
			return;
		}
		if (isParallelNameTaken(name, parallelOptions.map((item) => item.label))) {
			setParallelNameError(PARALLEL_NAME_EXISTS);
			notifications.show({ color: 'red', title: 'Ошибка', message: PARALLEL_NAME_EXISTS });
			return;
		}
		setParallelNameError(null);
		createParallelMutation.mutate({ name, graduates: newParallelGraduates });
	};

	if (isNew && !canCreate) {
		return (
			<Alert color="red" title="Доступ запрещён" m="md">
				Нет прав на создание класса
			</Alert>
		);
	}

	if (!isNew && !canRead) {
		return (
			<Alert color="red" title="Доступ запрещён" m="md">
				Нет прав на просмотр класса
			</Alert>
		);
	}

	return (
		<>
			<MainEntityForm
				title="Класс"
				queryKey={['schooltask', 'class']}
				listQueryKey={['schooltask', 'classes']}
				load={schooltaskClassApi.get}
				save={schooltaskClassApi.update}
				create={schooltaskClassApi.create}
				remove={schooltaskClassApi.remove}
				initialData={initialData}
				validate={(data) =>
					validateClassForm(data, {
						existingClasses,
						excludeClassId: isNew ? 0 : entityId,
					})
				}
				transformBeforeSave={(data) => {
					const payload = prepareClassSavePayload(data);
					if (!canUpdateZam) {
						delete payload.users;
					}
					return payload;
				}}
				canSave={canSave}
				canDelete={canDelete}
			>
				{({ data, setField, errors, readOnly }) => {
					const pupils = normalizeClassUsers(data.users).map((item) => String(item.user_id));
					const invalidSubIndexes = getInvalidSubGroupIndexes(data.sub);

					return (
						<Tabs value={activeTab} onChange={setActiveTab}>
							<Tabs.List>
								<Tabs.Tab value="general">Общие</Tabs.Tab>
								<Tabs.Tab value="subjects">Предметные группы</Tabs.Tab>
							</Tabs.List>

							<Tabs.Panel value="general" pt="sm">
								<Stack gap="sm">
									<TextInput
										label="Название"
										withAsterisk
										value={data.name ?? ''}
										error={errors.name}
										readOnly={readOnly}
										onChange={(event) => setField('name', event.currentTarget.value)}
									/>
									<Group align="flex-end" gap="xs" wrap="nowrap">
										<Select
											label="Параллель"
											withAsterisk
											style={{ flex: 1 }}
											data={parallelOptions}
											value={data.parent_id ? String(data.parent_id) : null}
											error={errors.parent_id}
											readOnly={readOnly}
											onChange={(value) => setField('parent_id', value ? Number(value) : null)}
											searchable
											clearable
										/>
										{canCreateParallel && !readOnly ? (
											<ActionIcon
												variant="light"
												size="lg"
												aria-label="Добавить параллель"
												onClick={() => {
													setOnParallelCreated(() => (parentId: number) => {
														setField('parent_id', parentId);
													});
													setParallelNameError(null);
													setParallelModalOpen(true);
												}}
											>
												<IconPlus size={18} />
											</ActionIcon>
										) : null}
									</Group>
									<Select
										label="Классный руководитель"
										data={tutorOptions}
										value={data.user_id ? String(data.user_id) : null}
										readOnly={readOnly}
										onChange={(value) => setField('user_id', value ? Number(value) : null)}
										searchable
										clearable
									/>
									<MultiSelect
										label="Ученики"
										description={
											!canUpdateZam ? 'Редактирование доступно только завучу' : undefined
										}
										data={pupilOptions}
										value={pupils}
										disabled={readOnly || !canUpdateZam}
										onChange={(values) =>
											setField(
												'users',
												values.map((value, index) => ({
													id: index + 1,
													user_id: Number(value),
												})),
											)
										}
										searchable
										clearable
									/>
								</Stack>
							</Tabs.Panel>

							<Tabs.Panel value="subjects" pt="sm">
								<Stack gap="sm">
									<Group justify="space-between">
										<strong>Предметные группы</strong>
										{!readOnly ? (
											<Button
												size="xs"
												variant="light"
												leftSection={<IconPlus size={14} />}
												onClick={() => setField('sub', addSubGroup(data.sub, data.id))}
											>
												Добавить
											</Button>
										) : null}
									</Group>
									{errors.sub ? (
										<Alert color="red" title="Ошибка">
											{errors.sub}
										</Alert>
									) : null}
									<Table withTableBorder withColumnBorders>
										<Table.Thead>
											<Table.Tr>
												<Table.Th>Название</Table.Th>
												<Table.Th>Предмет</Table.Th>
												<Table.Th>Учитель</Table.Th>
												<Table.Th>Ученики</Table.Th>
												<Table.Th w={40} />
											</Table.Tr>
										</Table.Thead>
										<Table.Tbody>
											{(data.sub ?? []).map((row, index) => (
												<Table.Tr key={`${row.id}-${index}`}>
													<Table.Td>
														<TextInput
															value={row.name ?? ''}
															readOnly={readOnly}
															error={
																errors.sub && invalidSubIndexes.has(index)
																	? errors.sub
																	: undefined
															}
															onChange={(event) =>
																setField(
																	'sub',
																	updateSubGroup(data.sub, index, {
																		name: event.currentTarget.value,
																	}),
																)
															}
														/>
													</Table.Td>
													<Table.Td>
														<Select
															data={subjectOptions}
															value={row.subject_id ? String(row.subject_id) : null}
															readOnly={readOnly}
															onChange={(value) =>
																setField(
																	'sub',
																	updateSubGroup(data.sub, index, {
																		subject_id: value ? Number(value) : null,
																	}),
																)
															}
															searchable
															clearable
														/>
													</Table.Td>
													<Table.Td>
														<Select
															data={tutorOptions}
															value={row.user_id ? String(row.user_id) : null}
															readOnly={readOnly}
															onChange={(value) =>
																setField(
																	'sub',
																	updateSubGroup(data.sub, index, {
																		user_id: value ? Number(value) : null,
																	}),
																)
															}
															searchable
															clearable
														/>
													</Table.Td>
													<Table.Td>
														<MultiSelect
															data={pupilOptions}
															value={(row.users ?? []).map((item) => String(item.user_id))}
															disabled={readOnly || (!canUpdateZam && !canUpdate)}
															onChange={(values) =>
																setField(
																	'sub',
																	updateSubGroup(data.sub, index, {
																		users: values.map((value, userIndex) => ({
																			id: userIndex + 1,
																			user_id: Number(value),
																		})),
																	}),
																)
															}
															searchable
															clearable
														/>
													</Table.Td>
													<Table.Td>
														{!readOnly ? (
															<ActionIcon
																color="red"
																variant="light"
																onClick={() => setField('sub', removeSubGroup(data.sub, index))}
															>
																<IconTrash size={16} />
															</ActionIcon>
														) : null}
													</Table.Td>
												</Table.Tr>
											))}
										</Table.Tbody>
									</Table>
								</Stack>
							</Tabs.Panel>
						</Tabs>
					);
				}}
			</MainEntityForm>
			<Modal
				opened={parallelModalOpen}
				onClose={() => {
					setParallelModalOpen(false);
					setNewParallelName('');
					setNewParallelGraduates(false);
					setParallelNameError(null);
					setOnParallelCreated(null);
				}}
				title="Новая параллель"
				centered
			>
				<Stack gap="sm">
					<TextInput
						label="Название"
						withAsterisk
						placeholder="Например: 5"
						value={newParallelName}
						error={parallelNameError}
						onChange={(event) => {
							setNewParallelName(event.currentTarget.value);
							setParallelNameError(null);
						}}
						data-autofocus
					/>
					<Checkbox
						label="Выпускная параллель"
						description="Классы этой параллели будут выпускаться, а не переводиться"
						checked={newParallelGraduates}
						onChange={(event) => setNewParallelGraduates(event.currentTarget.checked)}
					/>
					<Group justify="flex-end" gap="xs">
						<Button
							variant="default"
							onClick={() => {
								setParallelModalOpen(false);
								setNewParallelName('');
								setNewParallelGraduates(false);
								setParallelNameError(null);
								setOnParallelCreated(null);
							}}
						>
							Отмена
						</Button>
						<Button
							loading={createParallelMutation.isPending}
							disabled={!newParallelName.trim()}
							onClick={submitNewParallel}
						>
							Создать
						</Button>
					</Group>
				</Stack>
			</Modal>
		</>
	);
}
