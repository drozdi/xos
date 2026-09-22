import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { iblockBlockApi, iblockTypeApi } from '@/core/api/endpoints/iblockApi';

type SelectOption = { value: string; label: string };

function toOptions(
	items: Array<{ id: number; name: string; code: string }>,
): SelectOption[] {
	return items.map((item) => ({
		value: String(item.id),
		label: item.code ? `${item.name} (${item.code})` : item.name || String(item.id),
	}));
}

/** Cascade type → block filters for iblock list apps. Clearable = no filter. */
export function useIblockTypeBlockFilter(launchBlockId?: number) {
	const initialBlock =
		launchBlockId != null && Number.isFinite(launchBlockId) && launchBlockId > 0
			? String(launchBlockId)
			: null;

	const [typeId, setTypeId] = useState<string | null>(null);
	const [blockId, setBlockId] = useState<string | null>(initialBlock);

	const typesQuery = useQuery({
		queryKey: ['iblock', 'types', 'filter-select'],
		queryFn: () => iblockTypeApi.list({ t: 'list', limit: -1, offset: 1, filters: {} }),
	});

	const blocksQuery = useQuery({
		queryKey: ['iblock', 'blocks', 'filter-select', typeId],
		queryFn: () =>
			iblockBlockApi.list({
				t: 'list',
				limit: -1,
				offset: 1,
				filters: typeId ? { type_id: Number(typeId) } : {},
			}),
	});

	const typeOptions = useMemo(
		() => toOptions(typesQuery.data?.items ?? []),
		[typesQuery.data?.items],
	);

	const blockOptions = useMemo(
		() => toOptions(blocksQuery.data?.items ?? []),
		[blocksQuery.data?.items],
	);

	// Seed type from launch block once blocks load
	useEffect(() => {
		if (typeId != null || !initialBlock || !blocksQuery.data?.items) {
			return;
		}
		const match = blocksQuery.data.items.find((b) => String(b.id) === initialBlock);
		if (match?.type_id != null) {
			setTypeId(String(match.type_id));
		}
	}, [typeId, initialBlock, blocksQuery.data?.items]);

	// Drop block if it disappears from filtered set
	useEffect(() => {
		if (blockId == null || !blocksQuery.data?.items) {
			return;
		}
		const exists = blocksQuery.data.items.some((b) => String(b.id) === blockId);
		if (!exists) {
			setBlockId(null);
		}
	}, [blockId, blocksQuery.data?.items]);

	const onTypeChange = (value: string | null) => {
		setTypeId(value);
		setBlockId(null);
	};

	const typeFilter = useMemo(
		() => (typeId ? { type_id: Number(typeId) } : {}),
		[typeId],
	);
	const blockFilter = useMemo(
		() => (blockId ? { block_id: Number(blockId) } : {}),
		[blockId],
	);

	return {
		typeId,
		blockId,
		setBlockId,
		onTypeChange,
		typeOptions,
		blockOptions,
		typeFilter,
		blockFilter,
		selectedBlockId: blockId ? Number(blockId) : null,
	};
}
