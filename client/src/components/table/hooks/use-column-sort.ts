import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ColumnEntity, SortRule, TableSortState, TableStorage } from '../type';
import { getColumnFields } from '../utils/column-fields';

function toSortState<T>(rules: SortRule<T>[]): TableSortState<T> {
	const first = rules[0];
	return {
		rules,
		key: first?.key,
		descending: first?.descending ?? true,
	};
}

function loadStoredSort<T>(storage?: TableStorage): SortRule<T>[] {
	const stored = storage?.getItem('columns.sort');
	if (Array.isArray(stored)) {
		return stored as SortRule<T>[];
	}
	return [];
}

function syncRules<T>(rules: SortRule<T>[], fields: (keyof T)[]): SortRule<T>[] {
	if (!rules.length) {
		return [];
	}
	const fieldSet = new Set(fields);
	return rules.filter((rule) => fieldSet.has(rule.key));
}

export function useColumnSort<T>(
	columns: ColumnEntity<T>[],
	storage?: TableStorage,
	sortKey?: keyof T,
	sortDesc: boolean = false,
	multiSort = false,
	controlledRules?: SortRule<T>[],
) {
	const fields = getColumnFields(columns);
	const fieldsKey = fields.join('|');
	const prevFieldsKeyRef = useRef(fieldsKey);
	const controlledRulesKey = useMemo(
		() =>
			controlledRules?.map((rule) => `${String(rule.key)}:${rule.descending ? 1 : 0}`).join('|') ??
			'',
		[controlledRules],
	);

	const [internalSort, setInternalSort] = useState<TableSortState<T>>(() => {
		const stored = loadStoredSort<T>(storage);
		if (stored.length) {
			return toSortState(syncRules(stored, fields));
		}
		if (sortKey) {
			return toSortState([{ key: sortKey, descending: sortDesc }]);
		}
		return toSortState([]);
	});

	const controlledSort = useMemo(() => {
		if (!controlledRules) {
			return null;
		}
		return toSortState(syncRules(controlledRules, fields));
	}, [controlledRules, controlledRulesKey, fieldsKey, fields]);

	const sort = controlledSort ?? internalSort;

	useEffect(() => {
		if (prevFieldsKeyRef.current === fieldsKey) {
			return;
		}
		prevFieldsKeyRef.current = fieldsKey;

		if (controlledRules) {
			return;
		}

		setInternalSort((prev) => {
			const synced = toSortState(syncRules(prev.rules, fields));
			if (synced.rules.length !== prev.rules.length && storage) {
				storage.setItem('columns.sort', synced.rules);
			}
			return synced;
		});
	}, [fieldsKey, fields, controlledRules, storage]);

	const changeSort = useCallback(
		(field: keyof T, options?: { multi?: boolean }) => {
			if (controlledRules) {
				return;
			}

			const useMulti = options?.multi ?? multiSort;

			setInternalSort((prev) => {
				let rules = [...prev.rules];
				const existingIndex = rules.findIndex((rule) => rule.key === field);

				if (useMulti) {
					if (existingIndex === -1) {
						rules.push({ key: field, descending: true });
					} else {
						const existing = rules[existingIndex]!;
						if (existing.descending) {
							rules[existingIndex] = { key: field, descending: false };
						} else {
							rules = rules.filter((_, index) => index !== existingIndex);
						}
					}
				} else if (existingIndex !== -1) {
					const existing = rules[existingIndex]!;
					if (existing.descending) {
						rules = [{ key: field, descending: false }];
					} else {
						rules = [];
					}
				} else {
					rules = [{ key: field, descending: true }];
				}

				const next = toSortState(rules);
				storage?.setItem('columns.sort', next.rules);
				return next;
			});
		},
		[controlledRules, multiSort, storage],
	);

	return {
		sort,
		changeSort,
	};
}
