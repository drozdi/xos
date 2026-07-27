import { useMemo } from 'react';

export interface UseTableFilterOptions<T> {
	data: T[];
	searchValue: string;
	searchFields?: (keyof T)[];
}

export function useTableFilter<T extends Record<string, any>>({
	data,
	searchValue,
	searchFields = [],
}: UseTableFilterOptions<T>) {
	const filteredData = useMemo(() => {
		if (!searchValue || !searchFields.length) {
			return data;
		}

		const lowerSearch = searchValue.toLowerCase();

		return data.filter((item) =>
			searchFields.some((field) => {
				const value = item[field];
				if (value == null) return false;

				// Обработка разных типов данных
				if (typeof value === 'string') {
					return value.toLowerCase().includes(lowerSearch);
				}

				if (typeof value === 'number') {
					return String(value).includes(lowerSearch);
				}

				if (typeof value === 'object') {
					// Для вложенных объектов (например, item.config.name)
					return JSON.stringify(value).toLowerCase().includes(lowerSearch);
				}

				return false;
			})
		);
	}, [data, searchValue, searchFields]);

	return filteredData;
}
