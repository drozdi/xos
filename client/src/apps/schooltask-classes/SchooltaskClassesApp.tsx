import { Alert, Button, Checkbox, Group } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';

import { DataTable, usePaginatedList } from '@/components/table';
import { extractApiErrorMessage, notifyApiError } from '@/core/api/apiError';
import { schooltaskClassApi } from '@/core/api/endpoints/schooltaskApi';
import { queryKeys } from '@/core/api/queryKeys';
import { useWindowTitle } from '@/core/hooks/useWindowTitle';
import { confirmAction } from '@/core/confirm/confirmAction';
import {
	useCanCreateSchooltaskClass,
	useCanDeleteSchooltaskClass,
	useCanReadSchooltaskClass,
	useCanUpdateSchooltaskClass,
} from '@/features/schooltask/schooltaskAccess';
import { useLaunchSchooltaskApp } from '@/features/schooltask/schooltaskAppUtils';
import { MainListLayout } from '@/features/main/MainListLayout';

export default function SchooltaskClassesApp() {
	useWindowTitle('Классы');
	const launchApp = useLaunchSchooltaskApp();
	const queryClient = useQueryClient();
	const canRead = useCanReadSchooltaskClass();
	const canCreate = useCanCreateSchooltaskClass();
	const canUpdate = useCanUpdateSchooltaskClass();
	const canDelete = useCanDeleteSchooltaskClass();
	const pagination = usePaginatedList();
	const [showGraduated, setShowGraduated] = useState(false);

	const listRequest = useMemo(
		() => ({
			...pagination.listRequest,
			filters: { graduated: showGraduated },
		}),
		[pagination.listRequest, showGraduated],
	);

	const listQuery = useQuery({
		queryKey: queryKeys.schooltask.classes(listRequest),
		queryFn: () => schooltaskClassApi.list(listRequest),
		enabled: canRead,
	});

	const promoteMutation = useMutation({
		mutationFn: (id: number) => schooltaskClassApi.promote(id),
		onSuccess: () => {
			notifications.show({ message: 'Класс переведён', color: 'green' });
			void queryClient.invalidateQueries({ queryKey: ['schooltask', 'classes'] });
		},
		onError: (error) => notifyApiError(error, 'Ошибка перевода'),
	});

	const graduateMutation = useMutation({
		mutationFn: (id: number) => schooltaskClassApi.graduate(id),
		onSuccess: () => {
			notifications.show({ message: 'Класс выпущен', color: 'green' });
			void queryClient.invalidateQueries({ queryKey: ['schooltask', 'classes'] });
		},
		onError: (error) => notifyApiError(error, 'Ошибка выпуска'),
	});

	const promoteAllMutation = useMutation({
		mutationFn: () => schooltaskClassApi.promoteAll(),
		onSuccess: (result) => {
			notifications.show({
				message: `Готово: переведено ${result.promoted}, выпущено ${result.graduated}`,
				color: 'green',
			});
			void queryClient.invalidateQueries({ queryKey: ['schooltask', 'classes'] });
			void queryClient.invalidateQueries({ queryKey: queryKeys.schooltask.classParallels });
		},
		onError: (error) => notifyApiError(error, 'Ошибка массового перевода'),
	});

	const deleteMutation = useMutation({
		mutationFn: (id: number) => schooltaskClassApi.remove(id),
		onSuccess: () => {
			notifications.show({ message: 'Удалено', color: 'green' });
			void queryClient.invalidateQueries({
				queryKey: queryKeys.schooltask.classes(pagination.listRequest),
			});
		},
		onError: (error) => notifyApiError(error, 'Ошибка удаления'),
	});

	const columns = useMemo(
		() => [
			{ field: 'id' as const, header: 'ID', width: 70 },
			{ field: 'name' as const, header: 'Класс' },
			{ field: 'tutor' as const, header: 'Классный руководитель' },
			{
				field: 'transition' as const,
				header: 'Переход',
				width: 130,
				render: (row: {
					transition?: 'graduate' | 'promote' | 'graduated';
					graduated?: boolean;
					should_graduate?: boolean;
					graduated_year?: number | null;
				}) => {
					const action =
						row.transition ??
						(row.graduated ? 'graduated' : row.should_graduate ? 'graduate' : 'promote');
					if (action === 'graduated') {
						return `Выпущен${row.graduated_year ? ` (${row.graduated_year})` : ''}`;
					}
					return action === 'graduate' ? 'Выпускается' : 'Переводится';
				},
			},
			...(canUpdate
				? [
						{
							field: 'id' as const,
							header: 'Действия',
							width: 140,
							render: (row: {
								id: number;
								name?: string;
								graduated?: boolean;
								should_graduate?: boolean;
								transition?: 'graduate' | 'promote' | 'graduated';
							}) => {
								const action =
									row.transition ??
									(row.graduated ? 'graduated' : row.should_graduate ? 'graduate' : 'promote');
								if (action === 'graduated') {
									return null;
								}
								if (action === 'graduate') {
									return (
										<Button
											size="compact-xs"
											variant="light"
											color="orange"
											loading={graduateMutation.isPending}
											onClick={(event) => {
												event.stopPropagation();
												confirmAction({
													title: 'Выпуск класса',
													message: `Выпустить класс «${row.name}»?`,
													confirmLabel: 'Выпустить',
													confirmColor: 'orange',
													onConfirm: () => graduateMutation.mutate(row.id),
												});
											}}
										>
											Выпустить
										</Button>
									);
								}
								return (
									<Button
										size="compact-xs"
										variant="light"
										loading={promoteMutation.isPending}
										onClick={(event) => {
											event.stopPropagation();
											confirmAction({
												title: 'Перевод класса',
												message: `Перевести класс «${row.name}» на следующий год?`,
												confirmLabel: 'Перевести',
												onConfirm: () => promoteMutation.mutate(row.id),
											});
										}}
									>
										Перевести
									</Button>
								);
							},
						},
					]
				: []),
		],
		[canUpdate, graduateMutation, promoteMutation],
	);

	const openClass = (id: number) => launchApp('schooltask-class', id);

	if (!canRead) {
		return (
			<MainListLayout title="Классы" isLoading={false} isError={false} onRefresh={() => {}}>
				<Alert color="red" title="Доступ запрещён">
					Нет прав на просмотр классов
				</Alert>
			</MainListLayout>
		);
	}

	return (
		<MainListLayout
			title="Классы"
			total={listQuery.data?.total}
			isLoading={listQuery.isLoading}
			isError={listQuery.isError}
			errorMessage={
				listQuery.error
					? extractApiErrorMessage(listQuery.error, 'Не удалось загрузить данные')
					: undefined
			}
			isFetching={listQuery.isFetching}
			onRefresh={() => void listQuery.refetch()}
			onCreate={canCreate ? () => openClass(0) : undefined}
			filters={
				<Group justify="space-between" wrap="wrap">
					<Checkbox
						label="Показать выпускников"
						checked={showGraduated}
						onChange={(event) => setShowGraduated(event.currentTarget.checked)}
					/>
					{canUpdate ? (
						<Button
							size="xs"
							variant="light"
							loading={promoteAllMutation.isPending}
							onClick={() => {
								confirmAction({
									title: 'Перевести всех',
									message:
										'Перевести все активные классы на следующий год? Выпускные параллели будут выпущены.',
									confirmLabel: 'Перевести всех',
									onConfirm: () => promoteAllMutation.mutate(),
								});
							}}
						>
							Перевести всех
						</Button>
					) : null}
				</Group>
			}
		>
			<DataTable
				storageKey="schooltask-classes"
				columns={columns}
				data={listQuery.data?.items ?? []}
				total={listQuery.data?.total}
				page={pagination.page}
				limit={pagination.limit}
				onPageChange={pagination.onPageChange}
				onLimitChange={pagination.onLimitChange}
				serverPagination
				loading={listQuery.isFetching && !listQuery.isLoading}
				onRowClick={(row) => openClass(row.id)}
				onEdit={canUpdate ? (row) => openClass(row.id) : undefined}
				onDelete={canDelete ? (row) => deleteMutation.mutateAsync(row.id) : undefined}
				getRowLabel={(row) => row.name || String(row.id)}
			/>
		</MainListLayout>
	);
}
