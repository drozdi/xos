import {
	Alert,
	Button,
	Checkbox,
	Flex,
	Form,
	Input,
	Modal,
	Select,
	Table,
	Tabs,
} from 'antd';
import { notifications } from '@/ui/toast';
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
	buildSubGroupName,
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
	const [activeTab, setActiveTab] = useState('general');
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
				teachers: (item.users ?? []).map((user) => ({
					value: String(user.value),
					label: user.text ?? String(user.value),
				})),
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

	const closeParallelModal = () => {
		setParallelModalOpen(false);
		setNewParallelName('');
		setNewParallelGraduates(false);
		setParallelNameError(null);
		setOnParallelCreated(null);
	};

	if (isNew && !canCreate) {
		return (
			<div style={{ margin: 16 }}>
				<Alert type="error" showIcon message="Доступ запрещён" description="Нет прав на создание класса" />
			</div>
		);
	}

	if (!isNew && !canRead) {
		return (
			<div style={{ margin: 16 }}>
				<Alert type="error" showIcon message="Доступ запрещён" description="Нет прав на просмотр класса" />
			</div>
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
					const classPupilIdSet = new Set(pupils);
					const classPupilOptions = pupilOptions.filter((item) => classPupilIdSet.has(item.value));
					const invalidSubIndexes = getInvalidSubGroupIndexes(data.sub);

					return (
						<Tabs
							activeKey={activeTab}
							onChange={setActiveTab}
							items={[
								{
									key: 'general',
									label: 'Общие',
									children: (
										<Flex vertical gap={12} style={{ paddingTop: 8 }}>
											<Form.Item
												label="Название"
												required
												validateStatus={errors.name ? 'error' : undefined}
												help={errors.name}
												style={{ marginBottom: 0 }}
											>
												<Input
													value={data.name ?? ''}
													readOnly={readOnly}
													onChange={(event) => setField('name', event.target.value)}
												/>
											</Form.Item>
											<Flex align="flex-end" gap={8} wrap="nowrap">
												<Form.Item
													label="Параллель"
													required
													validateStatus={errors.parent_id ? 'error' : undefined}
													help={errors.parent_id}
													style={{ marginBottom: 0, flex: 1 }}
												>
													<Select
														options={parallelOptions}
														value={data.parent_id ? String(data.parent_id) : undefined}
														disabled={readOnly}
														onChange={(value) =>
															setField('parent_id', value ? Number(value) : null)
														}
														showSearch
														allowClear
														optionFilterProp="label"
													/>
												</Form.Item>
												{canCreateParallel && !readOnly ? (
													<Button
														type="default"
														aria-label="Добавить параллель"
														icon={<IconPlus size={18} />}
														onClick={() => {
															setOnParallelCreated(() => (parentId: number) => {
																setField('parent_id', parentId);
															});
															setParallelNameError(null);
															setParallelModalOpen(true);
														}}
													/>
												) : null}
											</Flex>
											<Form.Item label="Классный руководитель" style={{ marginBottom: 0 }}>
												<Select
													options={tutorOptions}
													value={data.user_id ? String(data.user_id) : undefined}
													disabled={readOnly}
													onChange={(value) =>
														setField('user_id', value ? Number(value) : null)
													}
													showSearch
													allowClear
													optionFilterProp="label"
												/>
											</Form.Item>
											<Form.Item
												label="Ученики"
												extra={
													!canUpdateZam ? 'Редактирование доступно только завучу' : undefined
												}
												style={{ marginBottom: 0 }}
											>
												<Select
													mode="multiple"
													options={pupilOptions}
													value={pupils}
													disabled={readOnly || !canUpdateZam}
													onChange={(values: string[]) =>
														setField(
															'users',
															values.map((value, index) => ({
																id: index + 1,
																user_id: Number(value),
															})),
														)
													}
													showSearch
													allowClear
													optionFilterProp="label"
												/>
											</Form.Item>
										</Flex>
									),
								},
								{
									key: 'subjects',
									label: 'Предметные группы',
									children: (
										<Flex vertical gap={12} style={{ paddingTop: 8 }}>
											<Flex justify="space-between" align="center">
												<strong>Предметные группы</strong>
												{!readOnly ? (
													<Button
														size="small"
														icon={<IconPlus size={14} />}
														onClick={() => setField('sub', addSubGroup(data.sub, data.id))}
													>
														Добавить
													</Button>
												) : null}
											</Flex>
											{errors.sub ? (
												<Alert type="error" showIcon message="Ошибка" description={errors.sub} />
											) : null}
											<Table
												size="small"
												pagination={false}
												bordered
												rowKey={(_, index) => String(index)}
												dataSource={data.sub ?? []}
												columns={[
													{
														title: 'Предмет',
														render: (_: unknown, row, index) => (
															<Select
																style={{ width: '100%' }}
																options={subjectOptions}
																value={row.subject_id ? String(row.subject_id) : undefined}
																disabled={readOnly}
																onChange={(value) => {
																	const subjectId = value ? Number(value) : null;
																	const subject = subjectOptions.find(
																		(item) => item.value === value,
																	);
																	const subjectLabel = subject?.label ?? '';
																	const teachers = subject?.teachers ?? [];
																	const nextTeacherId =
																		row.user_id &&
																		teachers.some((item) => item.value === String(row.user_id))
																			? row.user_id
																			: teachers.length === 1 && teachers[0]
																				? Number(teachers[0].value)
																				: null;
																	setField(
																		'sub',
																		updateSubGroup(data.sub, index, {
																			subject_id: subjectId,
																			name: buildSubGroupName(data.name, subjectLabel),
																			user_id: nextTeacherId,
																		}),
																	);
																}}
																showSearch
																allowClear
																optionFilterProp="label"
															/>
														),
													},
													{
														title: 'Название',
														render: (_: unknown, row, index) => (
															<>
																<Input
																	value={row.name ?? ''}
																	readOnly={readOnly}
																	status={
																		errors.sub && invalidSubIndexes.has(index) ? 'error' : undefined
																	}
																	onChange={(event) =>
																		setField(
																			'sub',
																			updateSubGroup(data.sub, index, {
																				name: event.target.value,
																			}),
																		)
																	}
																/>
																{errors.sub && invalidSubIndexes.has(index) ? (
																	<div style={{ color: '#ff4d4f', fontSize: 12 }}>{errors.sub}</div>
																) : null}
															</>
														),
													},
													{
														title: 'Учитель',
														render: (_: unknown, row, index) => {
															const subjectTeachers =
																subjectOptions.find(
																	(item) => item.value === String(row.subject_id ?? ''),
																)?.teachers ?? [];
															const teacherIdSet = new Set(
																subjectTeachers.map((item) => item.value),
															);
															const teacherValue =
																row.user_id && teacherIdSet.has(String(row.user_id))
																	? String(row.user_id)
																	: undefined;

															return (
																<Select
																	style={{ width: '100%' }}
																	options={subjectTeachers}
																	value={teacherValue}
																	disabled={readOnly || !row.subject_id}
																	placeholder={
																		!row.subject_id
																			? 'Сначала выберите предмет'
																			: subjectTeachers.length === 0
																				? 'У предмета нет учителей'
																				: undefined
																	}
																	onChange={(value) =>
																		setField(
																			'sub',
																			updateSubGroup(data.sub, index, {
																				user_id: value ? Number(value) : null,
																			}),
																		)
																	}
																	showSearch
																	allowClear
																	optionFilterProp="label"
																/>
															);
														},
													},
													{
														title: 'Ученики',
														render: (_: unknown, row, index) => (
															<Select
																mode="multiple"
																style={{ width: '100%' }}
																options={classPupilOptions}
																placeholder={
																	classPupilOptions.length === 0
																		? 'Сначала добавьте учеников в класс'
																		: undefined
																}
																value={(row.users ?? [])
																	.map((item) => String(item.user_id))
																	.filter((userId) => classPupilIdSet.has(userId))}
																disabled={readOnly || (!canUpdateZam && !canUpdate)}
																onChange={(values: string[]) =>
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
																showSearch
																allowClear
																optionFilterProp="label"
															/>
														),
													},
													{
														title: '',
														width: 48,
														render: (_: unknown, __: unknown, index) =>
															!readOnly ? (
																<Button
																	type="text"
																	danger
																	icon={<IconTrash size={16} />}
																	onClick={() => setField('sub', removeSubGroup(data.sub, index))}
																/>
															) : null,
													},
												]}
											/>
										</Flex>
									),
								},
							]}
						/>
					);
				}}
			</MainEntityForm>
			<Modal
				open={parallelModalOpen}
				onCancel={closeParallelModal}
				title="Новая параллель"
				centered
				footer={
					<Flex justify="flex-end" gap={8}>
						<Button onClick={closeParallelModal}>Отмена</Button>
						<Button
							type="primary"
							loading={createParallelMutation.isPending}
							disabled={!newParallelName.trim()}
							onClick={submitNewParallel}
						>
							Создать
						</Button>
					</Flex>
				}
			>
				<Flex vertical gap={12}>
					<Form.Item
						label="Название"
						required
						validateStatus={parallelNameError ? 'error' : undefined}
						help={parallelNameError}
						style={{ marginBottom: 0 }}
					>
						<Input
							placeholder="Например: 5"
							value={newParallelName}
							autoFocus
							onChange={(event) => {
								setNewParallelName(event.target.value);
								setParallelNameError(null);
							}}
						/>
					</Form.Item>
					<Checkbox
						checked={newParallelGraduates}
						onChange={(event) => setNewParallelGraduates(event.target.checked)}
					>
						Выпускная параллель
					</Checkbox>
					<div style={{ color: 'rgba(0,0,0,0.45)', fontSize: 12, marginTop: -4 }}>
						Классы этой параллели будут выпускаться, а не переводиться
					</div>
				</Flex>
			</Modal>
		</>
	);
}
