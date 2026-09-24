import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import {
	iblockBlockApi,
	iblockPropertyApi,
	iblockPropertyEnumApi,
	iblockSectionApi,
	iblockTypeApi,
} from '@/core/api/endpoints/iblockApi';

import { CONTENT_TYPE_CODE } from './contentCatalog';

export function useContentBlock(blockCode: string) {
	const typeQuery = useQuery({
		queryKey: ['iblock', 'content', 'type', CONTENT_TYPE_CODE],
		queryFn: async () => {
			const list = await iblockTypeApi.list({
				t: 'list',
				limit: -1,
				offset: 1,
				filters: { code: CONTENT_TYPE_CODE },
			});
			return list.items[0] ?? null;
		},
	});

	const typeId = typeQuery.data?.id ?? null;

	const blockQuery = useQuery({
		queryKey: ['iblock', 'content', 'block', blockCode, typeId],
		queryFn: async () => {
			const list = await iblockBlockApi.list({
				t: 'list',
				limit: -1,
				offset: 1,
				filters: {
					code: blockCode,
					...(typeId ? { type_id: typeId } : {}),
				},
			});
			return list.items[0] ?? null;
		},
		enabled: Boolean(blockCode) && typeQuery.isSuccess,
	});

	const blockId = blockQuery.data?.id ?? null;

	const sectionsQuery = useQuery({
		queryKey: ['iblock', 'content', 'sections', blockId],
		queryFn: () =>
			iblockSectionApi.list({
				t: 'list',
				limit: -1,
				offset: 1,
				filters: { block_id: blockId },
			}),
		enabled: blockId != null && blockId > 0,
	});

	const propertiesQuery = useQuery({
		queryKey: ['iblock', 'content', 'properties', blockId],
		queryFn: async () => {
			const list = await iblockPropertyApi.list({
				t: 'list',
				limit: -1,
				offset: 1,
				filters: { block_id: blockId },
			});
			return Promise.all(list.items.map((item) => iblockPropertyApi.get(item.id)));
		},
		enabled: blockId != null && blockId > 0,
	});

	const difficultyProperty = useMemo(
		() => propertiesQuery.data?.find((p) => p.code === 'DIFFICULTY') ?? null,
		[propertiesQuery.data],
	);

	const difficultyEnumsQuery = useQuery({
		queryKey: ['iblock', 'content', 'difficulty-enums', difficultyProperty?.id],
		queryFn: () =>
			iblockPropertyEnumApi.list({
				t: 'list',
				limit: -1,
				offset: 1,
				filters: { property_id: difficultyProperty!.id },
			}),
		enabled: difficultyProperty != null && difficultyProperty.id > 0,
	});

	const sectionOptions = useMemo(
		() =>
			(sectionsQuery.data?.items ?? []).map((item) => ({
				value: String(item.id),
				label: item.name || item.code || String(item.id),
			})),
		[sectionsQuery.data?.items],
	);

	const difficultyOptions = useMemo(() => {
		const items = difficultyEnumsQuery.data?.items ?? [];
		if (items.length > 0) {
			return items.map((item) => ({
				value: item.code || String(item.id),
				label: item.name || item.code || String(item.id),
				id: item.id,
			}));
		}
		return [
			{ value: 'easy', label: 'Легко', id: 0 },
			{ value: 'medium', label: 'Средне', id: 0 },
			{ value: 'hard', label: 'Сложно', id: 0 },
		];
	}, [difficultyEnumsQuery.data?.items]);

	const resolveDifficultyCode = (raw: unknown): string | null => {
		if (raw == null || raw === '') return null;
		const scalar =
			typeof raw === 'object' && raw !== null && !Array.isArray(raw) && 'id' in raw
				? String((raw as { id: number }).id)
				: Array.isArray(raw)
					? String(raw[0] ?? '')
					: String(raw);
		if (!scalar) return null;
		const byCode = difficultyOptions.find((o) => o.value === scalar);
		if (byCode) return byCode.value;
		const byId = difficultyOptions.find((o) => o.id > 0 && String(o.id) === scalar);
		return byId?.value ?? scalar;
	};

	const isLoading = typeQuery.isLoading || blockQuery.isLoading;
	const isReady = blockId != null && blockId > 0;
	const error =
		typeQuery.isError || blockQuery.isError
			? 'Не удалось загрузить инфоблок. Запустите seed: php bin/console xos:seed-project'
			: !isLoading && !isReady
				? `Инфоблок «${blockCode}» не найден. Запустите seed: php bin/console xos:seed-project`
				: null;

	return {
		typeId,
		blockId,
		block: blockQuery.data,
		sectionOptions,
		difficultyOptions,
		resolveDifficultyCode,
		properties: propertiesQuery.data ?? [],
		isLoading,
		isReady,
		error,
		sectionsQuery,
		propertiesQuery,
	};
}
