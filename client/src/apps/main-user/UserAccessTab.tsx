import {
	Checkbox,
	Paper,
	SegmentedControl,
	SimpleGrid,
	Stack,
	Text,
	Title,
} from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { getAccountMap } from '@/core/api/endpoints/account';
import { mainClaimantApi, type GroupAccessItem } from '@/core/api/endpoints/mainApi';
import { queryKeys } from '@/core/api/queryKeys';
import {
	applyModuleAccessMode,
	CAN_SCOPE_LABELS,
	checkedToLevel,
	getAccessLevel,
	getModuleAccessMode,
	getModuleScopeClaimants,
	levelToChecked,
	resolveClaimantAccessMap,
	updateAccessLevel,
} from '@/features/main/accessRulesUtils';

interface UserAccessTabProps {
	accesses: Record<string, GroupAccessItem>;
	roles: string[];
	readOnly: boolean;
	onAccessesChange: (accesses: Record<string, GroupAccessItem>) => void;
	onRolesChange: (roles: string[]) => void;
}

const MODULE_MODE_OPTIONS = [
	{ label: 'Не доступен', value: 'none' },
	{ label: 'Доступен', value: 'available' },
	{ label: 'Полный доступ', value: 'full' },
] as const;

export function UserAccessTab({
	accesses,
	roles,
	readOnly,
	onAccessesChange,
	onRolesChange,
}: UserAccessTabProps) {
	const modulesQuery = useQuery({
		queryKey: queryKeys.main.appAccessModules,
		queryFn: () => mainClaimantApi.appAccessModules(),
	});

	const mapQuery = useQuery({
		queryKey: queryKeys.account.map,
		queryFn: () => getAccountMap(),
	});

	const moduleMaps = mapQuery.data ?? {};
	const modules = modulesQuery.data ?? [];

	const moduleCards = useMemo(() => {
		return modules.map((moduleGroup) => {
			const scopeClaimants = getModuleScopeClaimants(moduleGroup, moduleMaps);
			const mode = getModuleAccessMode(
				moduleGroup.module,
				roles,
				accesses,
				scopeClaimants,
			);

			return (
				<Paper key={moduleGroup.module} withBorder p="md">
					<Stack gap="sm">
						<Text fw={600}>{moduleGroup.moduleLabel}</Text>
						<SegmentedControl
							fullWidth
							data={[...MODULE_MODE_OPTIONS]}
							value={mode}
							disabled={readOnly}
							onChange={(value) => {
								const next = applyModuleAccessMode(
									moduleGroup.module,
									value as typeof mode,
									roles,
									accesses,
									scopeClaimants,
								);
								onRolesChange(next.roles);
								onAccessesChange(next.accesses);
							}}
						/>

						{mode === 'available' && scopeClaimants.length > 0 ? (
							<SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="sm">
								{scopeClaimants.map((claimant) => {
									const scopeMap = resolveClaimantAccessMap(claimant.code, moduleMaps);
									const scopeKeys = Object.keys(scopeMap);
									const level = getAccessLevel(accesses, claimant.id);
									const checked = levelToChecked(level, scopeMap);

									return (
										<Paper
											key={claimant.id}
											withBorder
											p="sm"
											bg="var(--mantine-color-gray-light)"
										>
											<Text fw={500} mb="xs" size="sm">
												{claimant.name}
											</Text>
											<Stack gap={4}>
												{scopeKeys.map((scopeKey) => (
													<Checkbox
														key={scopeKey}
														label={CAN_SCOPE_LABELS[scopeKey] ?? scopeKey}
														checked={checked[scopeKey] ?? false}
														disabled={readOnly}
														onChange={(event) => {
															const nextChecked = {
																...checked,
																[scopeKey]: event.currentTarget.checked,
															};
															const nextLevel = checkedToLevel(nextChecked, scopeMap);
															onAccessesChange(
																updateAccessLevel(
																	accesses,
																	claimant.id,
																	claimant.name,
																	nextLevel,
																),
															);
														}}
													/>
												))}
											</Stack>
										</Paper>
									);
								})}
							</SimpleGrid>
						) : null}

						{mode === 'available' && scopeClaimants.length === 0 ? (
							<Text size="sm" c="dimmed">
								Для модуля нет детализированных правил в setting.json
							</Text>
						) : null}
					</Stack>
				</Paper>
			);
		});
	}, [
		accesses,
		moduleMaps,
		modules,
		onAccessesChange,
		onRolesChange,
		readOnly,
		roles,
	]);

	const isLoading = modulesQuery.isLoading || mapQuery.isLoading;

	if (isLoading) {
		return (
			<Text size="sm" c="dimmed">
				Загрузка доступа к приложениям…
			</Text>
		);
	}

	if (modules.length === 0) {
		return (
			<Text size="sm" c="dimmed">
				Нет доступных приложений
			</Text>
		);
	}

	return (
		<Stack gap="md">
			<Title order={5}>Приложения</Title>
			<SimpleGrid cols={1} spacing="md">
				{moduleCards}
			</SimpleGrid>
		</Stack>
	);
}
