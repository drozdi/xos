import type { ToggleExpandOptions } from '../type';

/**
 * Pure expand-key list update used by TableData expand state.
 */
export function updateExpandKindKeys(
	current: string[],
	expandKey: string | string[],
	options: ToggleExpandOptions | undefined,
	allowMultiple: boolean,
): string[] {
	if (Array.isArray(expandKey)) {
		if (options?.remove) {
			return current.filter((key) => !expandKey.includes(key));
		}
		if (options?.merge) {
			return [...new Set([...current, ...expandKey])];
		}
		return expandKey;
	}

	if (allowMultiple) {
		return current.includes(expandKey)
			? current.filter((key) => key !== expandKey)
			: [...current, expandKey];
	}

	return current.includes(expandKey) ? [] : [expandKey];
}
