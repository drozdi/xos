import { Accordion, Checkbox, Paper, SimpleGrid, Stack, Text } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { mainClaimantApi, type AppAccessModule, type GroupAccessItem } from '@/core/api/endpoints/mainApi';
import { queryKeys } from '@/core/api/queryKeys';
import {
	checkedToLevel,
	getAccessLevel,
	getModuleScopeClaimants,
	levelToChecked,
	resolveClaimantScopeLabels,
	resolveClaimantScopeMap,
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
	accesses: Record<string, GroupAccessItem>,
	readOnly: boolean,
	onChange: (accesses: Record<string, GroupAccessItem>) => void,
) {
	const scopeMap = resolveClaimantScopeMap(claimant);
	const scopeLabels = resolveClaimantScopeLabels(claimant, scopeMap);
	const scopeKeys = Object.keys(scopeMap);
	const level = getAccessLevel(accesses, claimant.id);
	const checked = levelToChecked(level, scopeMap);

	return (
		<Paper key={claimant.id} withBorder p="sm" h="100%">
			<Text fw={500} mb="xs">
				{claimant.name}
			</Text>
			<Text size="xs" c="dimmed" mb="xs">
				{claimant.code}
			</Text>
			<Stack gap={4}>
				{scopeKeys.map((scopeKey) => (
					<Checkbox
						key={scopeKey}
						label={scopeLabels[scopeKey] ?? scopeKey}
						checked={checked[scopeKey] ?? false}
						disabled={readOnly}
						onChange={(event) => {
							const nextChecked = {
								...checked,
								[scopeKey]: event.currentTarget.checked,
							};
							const nextLevel = checkedToLevel(nextChecked, scopeMap);
							onChange(
								updateAccessLevel(accesses, claimant.id, claimant.name, nextLevel),
							);
						}}
					/>
				))}
			</Stack>
		</Paper>
	);
}

function hasModuleAccessRules(moduleGroup: AppAccessModule) {
	return getModuleScopeClaimants(moduleGroup).length > 0;
}

export function GroupAccessTab({ accesses, readOnly, onChange }: GroupAccessTabProps) {
	const { width: windowWidth } = useWindowSize();
	const columns = getAccessTabColumns(windowWidth);

	const modulesQuery = useQuery({
		queryKey: queryKeys.main.appAccessModules,
		queryFn: () => mainClaimantApi.appAccessModules(),
	});

	const modules = modulesQuery.data ?? [];

	const visibleModules = useMemo(
		() => modules.filter((moduleGroup) => hasModuleAccessRules(moduleGroup)),
		[modules],
	);

	if (modulesQuery.isLoading) {
		return (
			<Text size="sm" c="dimmed">
				Загрузка прав…
			</Text>
		);
	}

	if (visibleModules.length === 0) {
		return (
			<Text size="sm" c="dimmed">
				Нет доступных правил
			</Text>
		);
	}

	return (
		<Accordion variant="separated" multiple>
			{visibleModules.map((moduleGroup) => {
				const scopeClaimants = getModuleScopeClaimants(moduleGroup);

				return (
					<Accordion.Item key={moduleGroup.module} value={moduleGroup.module}>
						<Accordion.Control>{moduleGroup.moduleLabel}</Accordion.Control>
						<Accordion.Panel>
							<SimpleGrid cols={columns} mt="xs">
								{scopeClaimants.map((claimant) =>
									renderScopeClaimantCard(claimant, accesses, readOnly, onChange),
								)}
							</SimpleGrid>
						</Accordion.Panel>
					</Accordion.Item>
				);
			})}
		</Accordion>
	);
}
