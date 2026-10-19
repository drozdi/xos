import type { ColumnEntity, TableStorage } from '../type';

export function genStorage(storageKey: string): TableStorage {
	const prefix = `${storageKey}.`;

	function keyStorage(key: string): string {
		return `${prefix}${key}`;
	}

	return {
		clear() {
			const keysToRemove: string[] = [];
			for (let i = 0; i < localStorage.length; i++) {
				const key = localStorage.key(i);
				if (key?.startsWith(prefix)) {
					keysToRemove.push(key);
				}
			}
			for (const key of keysToRemove) {
				localStorage.removeItem(key);
			}
		},
		setItem(key, value) {
			localStorage.setItem(keyStorage(key), JSON.stringify(value));
		},
		getItem(key) {
			const value = localStorage.getItem(keyStorage(key));
			if (value) {
				return JSON.parse(value);
			}
			return value;
		},
		removeItem(key) {
			localStorage.removeItem(keyStorage(key));
		},
	};
}

export function createSelectColumn<T>(): ColumnEntity<T> {
	return {
		field: '__select__' as keyof T,
		isSelecting: true,
		size: 1,
		level: 0,
		parentLevel: 0,
		columns: [],
		isDraggable: false,
		isGroup: false,
		isGrouped: false,
		isSorted: false,
		isColumns: false,
		isHeader: false,
		isField: false,
		isEmpty: true,
		isToggleable: false,
		isResizable: false,
		isActions: false,
		isHoverSlot: false,
		colspan: 1,
		isFieldSplit: false,
		width: 44,
		align: 'center',
	};
}

export function createHoverSlotColumn<T>(at: 'start' | 'end'): ColumnEntity<T> {
	return {
		field: '__hover_slot__' as keyof T,
		isHoverSlot: true,
		isHeader: true,
		isField: false,
		isEmpty: true,
		isSelecting: false,
		isActions: false,
		isDraggable: false,
		isGroup: false,
		isGrouped: false,
		isSorted: false,
		isColumns: false,
		isToggleable: false,
		isResizable: false,
		size: 1,
		level: 1,
		parentLevel: 0,
		columns: [],
		colspan: 1,
		isFieldSplit: false,
		actionsAt: at,
		width: 0,
		align: 'center',
	};
}
