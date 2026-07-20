import { Checkbox, Paper, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { getAccountMap } from '@/core/api/endpoints/account';
import { mainClaimantApi, type GroupAccessItem } from '@/core/api/endpoints/mainApi';
import { queryKeys } from '@/core/api/queryKeys';
import {
	CAN_SCOPE_LABELS,
	checkedToLevel,
	getAccessLevel,
	getModuleScopeClaimants,
	levelToChecked,
	resolveClaimantAccessMap,
	updateAccessLevel,
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

	const sections = useMemo(() => {
		return modules.map((moduleGroup) => {
			const scopeClaimants = getModuleScopeClaimants(moduleGroup, moduleMaps);
			const cards = scopeClaimants.flatMap((claimant) => {
				const scopeMap = resolveClaimantAccessMap(claimant.code, moduleMaps);
				const scopeKeys = Object.keys(scopeMap);
				if (scopeKeys.length === 0) {
					return [];
				}

				const level = getAccessLevel(accesses, claimant.id);
				const checked = levelToChecked(level, scopeMap);

				return [
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
									label={CAN_SCOPE_LABELS[scopeKey] ?? scopeKey}
									checked={checked[scopeKey] ?? false}
									disabled={readOnly}
									onChange={(event) => {
										const nextChecked = {
											...checked,
											[scopeKey]: event.currentTarget.checked,
										};
										const nextLevel = checkedToLevel(nextChecked, scopeMap);
										onChange(
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
					</Paper>,
				];
			});

			if (cards.length === 0) {
				return null;
			}

			return (
				<Stack key={moduleGroup.module} gap="sm">
					<Title order={5}>{moduleGroup.moduleLabel}</Title>
					<SimpleGrid cols={columns}>{cards}</SimpleGrid>
				</Stack>
			);
		});
	}, [accesses, columns, moduleMaps, modules, onChange, readOnly]);

	if (modulesQuery.isLoading || mapQuery.isLoading) {
		return (
			<Text size="sm" c="dimmed">
				Загрузка прав…
			</Text>
		);
	}

	if (sections.every((section) => section === null)) {
		return (
			<Text size="sm" c="dimmed">
				Нет доступных правил
			</Text>
		);
	}

	return <Stack gap="lg">{sections}</Stack>;
}
