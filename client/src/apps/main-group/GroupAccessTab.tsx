import { Card, Checkbox, Collapse, Flex, Typography } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { getAccountMap } from '@/core/api/endpoints/account';
import { mainClaimantApi, type AppAccessModule, type GroupAccessItem } from '@/core/api/endpoints/mainApi';
import { queryKeys } from '@/core/api/queryKeys';
import {
	CAN_SCOPE_LABELS,
	checkedToLevel,
	getAccessLevel,
	getModuleScopeClaimants,
	levelToChecked,
	resolveClaimantAccessMap,
	updateAccessLevel,
	type ClaimantRef,
} from '@/features/main/accessRulesUtils';
import { useWindowSize } from '@/core/windowManager';

interface GroupAccessTabProps {
	accesses: Record<string, GroupAccessItem>;
	readOnly: boolean;
	onChange: (accesses: Record<string, GroupAccessItem>) => void;
}

function getAccessTabColumns(windowWidth: number): number {
	if (windowWidth >= 768) {
		return 3;
	}
	if (windowWidth >= 480) {
		return 2;
	}
	return 1;
}

function renderScopeClaimantCard(
	claimant: ClaimantRef,
	scopeMap: Record<string, number>,
	accesses: Record<string, GroupAccessItem>,
	readOnly: boolean,
	onChange: (accesses: Record<string, GroupAccessItem>) => void,
) {
	const scopeKeys = Object.keys(scopeMap);
	const level = getAccessLevel(accesses, claimant.id);
	const checked = levelToChecked(level, scopeMap);

	return (
		<Card key={claimant.id} size="small" style={{ height: '100%' }}>
			<Typography.Text strong style={{ display: 'block', marginBottom: 4 }}>
				{claimant.name}
			</Typography.Text>
			<Typography.Text type="secondary" style={{ display: 'block', marginBottom: 8, fontSize: 12 }}>
				{claimant.code}
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
							onChange(
								updateAccessLevel(accesses, claimant.id, claimant.name, nextLevel),
							);
						}}
					>
						{CAN_SCOPE_LABELS[scopeKey] ?? scopeKey}
					</Checkbox>
				))}
			</Flex>
		</Card>
	);
}

function hasModuleAccessRules(moduleGroup: AppAccessModule, moduleMaps: Record<string, Record<string, unknown>>) {
	return getModuleScopeClaimants(moduleGroup, moduleMaps).length > 0;
}

export function GroupAccessTab({ accesses, readOnly, onChange }: GroupAccessTabProps) {
	const { width: windowWidth } = useWindowSize();
	const columns = getAccessTabColumns(windowWidth);

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

	const visibleModules = useMemo(
		() => modules.filter((moduleGroup) => hasModuleAccessRules(moduleGroup, moduleMaps)),
		[moduleMaps, modules],
	);

	if (modulesQuery.isLoading || mapQuery.isLoading) {
		return (
			<Typography.Text type="secondary" style={{ fontSize: 13 }}>
				Загрузка прав…
			</Typography.Text>
		);
	}

	if (visibleModules.length === 0) {
		return (
			<Typography.Text type="secondary" style={{ fontSize: 13 }}>
				Нет доступных правил
			</Typography.Text>
		);
	}

	return (
		<Collapse
			accordion={false}
			items={visibleModules.map((moduleGroup) => {
				const scopeClaimants = getModuleScopeClaimants(moduleGroup, moduleMaps);

				return {
					key: moduleGroup.module,
					label: moduleGroup.moduleLabel,
					children: (
						<div
							style={{
								display: 'grid',
								gap: 12,
								marginTop: 8,
								gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
							}}
						>
							{scopeClaimants.map((claimant) =>
								renderScopeClaimantCard(
									claimant,
									resolveClaimantAccessMap(claimant.code, moduleMaps),
									accesses,
									readOnly,
									onChange,
								),
							)}
						</div>
					),
				};
			})}
		/>
	);
}
