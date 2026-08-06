import {
	Accordion,
	Alert,
	Badge,
	Group,
	Paper,
	Stack,
	Text,
} from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { extractApiErrorMessage } from '@/core/api/apiError';
import {
	mainClaimantApi,
	type AccessOptions,
	type ClaimantListItem,
} from '@/core/api/endpoints/mainApi';
import { queryKeys } from '@/core/api/queryKeys';
import { useWindowTitle } from '@/core/hooks/useWindowTitle';
import { useCanReadMainClaimant } from '@/features/main/mainAccess';
import { MainListLayout } from '@/features/main/MainListLayout';

function codeModule(code: string): string {
	const dot = code.indexOf('.');
	return dot === -1 ? code : code.slice(0, dot);
}

function formatAccessOptions(options: AccessOptions | undefined): Array<{
	key: string;
	title: string;
	bit: number;
}> {
	if (!options || Array.isArray(options)) {
		return [];
	}
	return Object.entries(options)
		.map(([key, opt]) => ({
			key,
			title: opt.title || key,
			bit: opt.bit,
		}))
		.sort((a, b) => a.bit - b.bit || a.key.localeCompare(b.key));
}

type ModuleGroup = {
	module: string;
	items: ClaimantListItem[];
};

export default function MainClaimantsApp() {
	useWindowTitle('Доступные права');
	const canRead = useCanReadMainClaimant();

	const listRequest = useMemo(
		() => ({
			t: 'list' as const,
			limit: -1,
			offset: 1,
			sortBy: [{ key: 'code', order: 'ASC' as const }],
		}),
		[],
	);

	const listQuery = useQuery({
		queryKey: queryKeys.main.claimants(listRequest),
		queryFn: () => mainClaimantApi.list(listRequest),
		enabled: canRead,
	});

	const groups = useMemo((): ModuleGroup[] => {
		const items = listQuery.data?.items ?? [];
		const map = new Map<string, ClaimantListItem[]>();
		for (const item of items) {
			const module = codeModule(item.code);
			const list = map.get(module) ?? [];
			list.push(item);
			map.set(module, list);
		}
		return [...map.entries()]
			.sort(([a], [b]) => a.localeCompare(b))
			.map(([module, moduleItems]) => ({
				module,
				items: moduleItems.sort((a, b) => a.code.localeCompare(b.code)),
			}));
	}, [listQuery.data?.items]);

	if (!canRead) {
		return (
			<Alert color="red" title="Доступ запрещён" m="md">
				Нет прав на просмотр доступных прав
			</Alert>
		);
	}

	return (
		<MainListLayout
			title="Доступные права"
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
		>
			{groups.length === 0 ? (
				<Text c="dimmed" size="sm">
					Нет записей. Выполните sync: php bin/console main:claimant:sync
				</Text>
			) : (
				<Accordion
					variant="separated"
					multiple
					defaultValue={[]}
					styles={{
						root: { overflow: 'auto', flex: 1, minHeight: 0 },
					}}
				>
					{groups.map((group) => (
						<Accordion.Item key={group.module} value={group.module}>
							<Accordion.Control>
								<Group gap="xs">
									<Text fw={600} tt="capitalize">
										{group.module}
									</Text>
									<Badge size="sm" variant="light">
										{group.items.length}
									</Badge>
								</Group>
							</Accordion.Control>
							<Accordion.Panel>
								<Stack gap="sm">
									{group.items.map((claimant) => {
										const options = formatAccessOptions(claimant.access_options);
										return (
											<Paper key={claimant.id} withBorder p="sm" radius="sm">
												<Stack gap={6}>
													<Group justify="space-between" wrap="nowrap" align="flex-start">
														<div>
															<Text fw={500}>{claimant.name}</Text>
															<Text size="xs" c="dimmed" ff="monospace">
																{claimant.code}
															</Text>
														</div>
													</Group>
													{options.length === 0 ? (
														<Text size="sm" c="dimmed">
															Нет правил (access_options пуст)
														</Text>
													) : (
														<Group gap={6}>
															{options.map((opt) => (
																<Badge
																	key={opt.key}
																	variant="outline"
																	size="sm"
																	title={`${opt.key} = ${opt.bit}`}
																>
																	{opt.title}
																</Badge>
															))}
														</Group>
													)}
												</Stack>
											</Paper>
										);
									})}
								</Stack>
							</Accordion.Panel>
						</Accordion.Item>
					))}
				</Accordion>
			)}
		</MainListLayout>
	);
}
