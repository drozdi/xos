import { useEffect, useMemo, useState } from 'react';

import type { ListRequest } from '@/types/api.types';

const DEFAULT_LIMIT = 50;

type PaginatedListBase = Omit<ListRequest, 'limit' | 'offset'>;

export function usePaginatedList(baseRequest: PaginatedListBase = {}) {
	const [page, setPage] = useState(1);
	const [limit, setLimit] = useState(DEFAULT_LIMIT);
	const baseKey = JSON.stringify(baseRequest);

	useEffect(() => {
		setPage(1);
	}, [baseKey]);

	const listRequest = useMemo<ListRequest>(() => {
		const base = JSON.parse(baseKey) as PaginatedListBase;
		return {
			...base,
			limit,
			offset: page,
		};
	}, [baseKey, limit, page]);

	const onPageChange = (nextPage: number) => {
		setPage(nextPage);
	};

	const onLimitChange = (nextLimit: number) => {
		setLimit(nextLimit);
		setPage(1);
	};

	return {
		page,
		limit,
		listRequest,
		onPageChange,
		onLimitChange,
	};
}
