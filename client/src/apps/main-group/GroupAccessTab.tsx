import { Checkbox, Paper, SimpleGrid, Stack, Text } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { getAccountMap } from '@/core/api/endpoints/account';
import { mainClaimantApi, type GroupAccessItem } from '@/core/api/endpoints/mainApi';
import { queryKeys } from '@/core/api/queryKeys';
import { useWindowSize } from '@/core/windowManager';

import {
	CAN_SCOPE_LABELS,
	checkedToLevel,
	getGroupAccessLevel,
	levelToChecked,
	resolveClaimantAccessMap,
	updateGroupAccessLevel,
} from './groupFormUtils';

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

	const claimantsQuery = useQuery({
		queryKey: queryKeys.main.claimants({ limit: -1, offset: 1 }),
		queryFn: () => mainClaimantApi.list({ limit: -1, offset: 1 }),
	});

	const mapQuery = useQuery({
		queryKey: queryKeys.account.map,
		queryFn: () => getAccountMap(),
	});

	const mainMapAccess = (mapQuery.data?.main ?? {}) as Record<string, unknown>;
	const claimants = claimantsQuery.data?.items ?? [];

	const cards = useMemo(() => {
		if (claimants.length === 0) {
			return [];
		}

		return claimants.flatMap((claimant) => {
			const scopeMap = resolveClaimantAccessMap(claimant.code, mainMapAccess);
			const scopeKeys = Object.keys(scopeMap);
			if (scopeKeys.length === 0) {
				return [];
			}

			const level = getGroupAccessLevel(accesses, claimant.id);
			const checked = levelToChecked(level, scopeMap);
			const label = `${claimant.name} - ${claimant.code}`;

			return [
				<Paper key={claimant.id} withBorder p="sm" h="100%">
					<Text fw={500} mb="xs">
						{label}
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
										updateGroupAccessLevel(
											accesses,
											claimant.id,
											label,
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
	}, [accesses, claimants, mainMapAccess, onChange, readOnly]);

	if (claimantsQuery.isLoading || mapQuery.isLoading) {
		return (
			<Text size="sm" c="dimmed">
				Загрузка прав…
			</Text>
		);
	}

	if (claimants.length === 0) {
		return (
			<Text size="sm" c="dimmed">
				Нет доступных правил
			</Text>
		);
	}

	return <SimpleGrid cols={columns}>{cards}</SimpleGrid>;
}