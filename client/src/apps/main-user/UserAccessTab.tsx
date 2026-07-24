import { Card, Checkbox, Flex, Segmented, Typography } from 'antd';
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
				<Card key={moduleGroup.module} size="small">
					<Flex vertical gap={12}>
						<Typography.Text strong>{moduleGroup.moduleLabel}</Typography.Text>
						<Segmented
							block
							options={[...MODULE_MODE_OPTIONS]}
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
							<div
								style={{
									display: 'grid',
									gap: 12,
									gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
								}}
							>
								{scopeClaimants.map((claimant) => {
									const scopeMap = resolveClaimantAccessMap(claimant.code, moduleMaps);
									const scopeKeys = Object.keys(scopeMap);
									const level = getAccessLevel(accesses, claimant.id);
									const checked = levelToChecked(level, scopeMap);

									return (
										<Card key={claimant.id} size="small" type="inner">
											<Typography.Text strong style={{ display: 'block', marginBottom: 8, fontSize: 13 }}>
												{claimant.name}
											</Typography.Text>
											<Flex vertical gap={4}>
												{scopeKeys.map((scopeKey) => (
													<Checkbox
														key={scopeKey}
														checked={checked[scopeKey] ?? false}
														disabled={readOnly}
														onChange={(event) => {
															const nextChecked = {
																...checked,
																[scopeKey]: event.target.checked,
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
													>
														{CAN_SCOPE_LABELS[scopeKey] ?? scopeKey}
													</Checkbox>
												))}
											</Flex>
										</Card>
									);
								})}
							</div>
						) : null}

						{mode === 'available' && scopeClaimants.length === 0 ? (
							<Typography.Text type="secondary" style={{ fontSize: 13 }}>
								Для модуля нет детализированных правил в setting.json
							</Typography.Text>
						) : null}
					</Flex>
				</Card>
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
			<Typography.Text type="secondary" style={{ fontSize: 13 }}>
				Загрузка доступа к приложениям…
			</Typography.Text>
		);
	}

	if (modules.length === 0) {
		return (
			<Typography.Text type="secondary" style={{ fontSize: 13 }}>
				Нет доступных приложений
			</Typography.Text>
		);
	}

	return (
		<Flex vertical gap={16}>
			<Typography.Title level={5} style={{ margin: 0 }}>
				Приложения
			</Typography.Title>
			<Flex vertical gap={16}>
				{moduleCards}
			</Flex>
		</Flex>
	);
}
