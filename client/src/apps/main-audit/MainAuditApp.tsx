import { Alert, Select, Stack, TextInput } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';

import { DataTable, usePaginatedList } from '@/components/table';
import { extractApiErrorMessage } from '@/core/api/apiError';
import { mainAuditApi } from '@/core/api/endpoints/mainApi';
import { queryKeys } from '@/core/api/queryKeys';
import { useWindowTitle } from '@/core/hooks/useWindowTitle';
import { useCanReadMainAudit } from '@/features/main/mainAccess';
import { MainListLayout } from '@/features/main/MainListLayout';

const ACTION_OPTIONS = [
	{ value: '', label: 'Все действия' },
	{ value: 'create', label: 'create' },
	{ value: 'update', label: 'update' },
	{ value: 'delete', label: 'delete' },
	{ value: 'login', label: 'login' },
	{ value: 'logout', label: 'logout' },
];

export default function MainAuditApp() {
	useWindowTitle('Аудит');
	const canRead = useCanReadMainAudit();
	const [actionFilter, setActionFilter] = useState('');
	const [entityTypeFilter, setEntityTypeFilter] = useState('');
	const [qFilter, setQFilter] = useState('');

	const pagination = usePaginatedList({
		sortBy: [{ key: 'createdAt', order: 'DESC' }],
		filters: {
			...(actionFilter ? { action: actionFilter } : {}),
			...(entityTypeFilter.trim() ? { entity_type: entityTypeFilter.trim() } : {}),
			...(qFilter.trim() ? { q: qFilter.trim() } : {}),
		},
	});

	const listQuery = useQuery({
		queryKey: queryKeys.main.audit(pagination.listRequest),
		queryFn: () => mainAuditApi.list(pagination.listRequest),
		enabled: canRead,
	});

	const columns = useMemo(
		() => [
			{ field: 'created_at' as const, header: 'Когда', width: 160 },
			{ field: 'actor_label' as const, header: 'Актор', width: 140 },
			{ field: 'action' as const, header: 'Действие', width: 90 },
			{
				field: 'entity_type' as const,
				header: 'Сущность',
				render: (row: { entity_type: string; entity_id?: number | null }) =>
					row.entity_id != null ? `${row.entity_type} #${row.entity_id}` : row.entity_type,
			},
			{ field: 'summary' as const, header: 'Сводка' },
		],
		[],
	);

	if (!canRead) {
		return (
			<MainListLayout title="Аудит" isLoading={false} isError={false} onRefresh={() => {}}>
				<Alert color="red" title="Доступ запрещён">
					Нет прав can_read на main.audit
				</Alert>
			</MainListLayout>
		);
	}

	return (
		<MainListLayout
			title="Аудит"
			total={listQuery.data?.total}
			isLoading={listQuery.isLoading}
			isError={listQuery.isError}
			errorMessage={
				listQuery.error
					? extractApiErrorMessage(listQuery.error, 'Не удалось загрузить журнал')
					: undefined
			}
			isFetching={listQuery.isFetching}
			onRefresh={() => void listQuery.refetch()}
			filters={
				<Stack gap="xs">
					<Select
						label="Действие"
						data={ACTION_OPTIONS}
						value={actionFilter}
						onChange={(value) => setActionFilter(value ?? '')}
						clearable
					/>
					<TextInput
						label="Тип сущности"
						placeholder="main.user"
						value={entityTypeFilter}
						onChange={(e) => setEntityTypeFilter(e.currentTarget.value)}
					/>
					<TextInput
						label="Поиск"
						placeholder="сводка / актор"
						value={qFilter}
						onChange={(e) => setQFilter(e.currentTarget.value)}
					/>
				</Stack>
			}
		>
			<DataTable
				storageKey="main-audit"
				columns={columns}
				data={listQuery.data?.items ?? []}
				total={listQuery.data?.total}
				page={pagination.page}
				limit={pagination.limit}
				onPageChange={pagination.onPageChange}
				onLimitChange={pagination.onLimitChange}
				serverPagination
				loading={listQuery.isFetching && !listQuery.isLoading}
				getRowLabel={(row) => row.summary}
			/>
		</MainListLayout>
	);
}
