import { iblockElementApi } from '@/core/api/endpoints/iblockApi';

import { slugifyCode } from './slugifyCode';

/**
 * Build unique element code from name within a block.
 * If `base` is taken, appends `-2`, `-3`, …
 */
export async function allocateUniqueElementCode(
	blockId: number,
	name: string,
	options?: { excludeElementId?: number; fallback?: string },
): Promise<string> {
	const base = slugifyCode(name || options?.fallback || 'item');
	const list = await iblockElementApi.list({
		t: 'list',
		limit: -1,
		offset: 1,
		filters: { block_id: blockId },
	});
	const used = new Set(
		(list.items ?? [])
			.filter((item) => item.id !== options?.excludeElementId)
			.map((item) => (item.code || '').trim())
			.filter(Boolean),
	);

	if (!used.has(base)) {
		return base;
	}

	let n = 2;
	while (used.has(`${base}-${n}`)) {
		n += 1;
		if (n > 9999) {
			return `${base}-${Date.now()}`;
		}
	}
	return `${base}-${n}`;
}
