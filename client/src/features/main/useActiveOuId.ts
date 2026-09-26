import { useCallback, useEffect, useState } from 'react';

import { userDataApi } from '@/core/api/endpoints/userData';

export const ACTIVE_OU_CODE = 'main.active_ou_id';

export function useActiveOuId() {
	const [activeOuId, setActiveOuIdState] = useState<number | null>(null);
	const [restored, setRestored] = useState(false);

	useEffect(() => {
		let cancelled = false;
		void (async () => {
			try {
				const dto = await userDataApi.getOptional(ACTIVE_OU_CODE);
				if (!cancelled && dto != null) {
					const value = dto.value;
					const id =
						typeof value === 'number'
							? value
							: typeof value === 'string' && Number.isFinite(Number(value))
								? Number(value)
								: null;
					setActiveOuIdState(id !== null && id > 0 ? id : null);
				}
			} catch {
				// keep null
			} finally {
				if (!cancelled) {
					setRestored(true);
				}
			}
		})();
		return () => {
			cancelled = true;
		};
	}, []);

	const setActiveOuId = useCallback(async (ouId: number | null) => {
		setActiveOuIdState(ouId);
		if (ouId === null || ouId <= 0) {
			try {
				await userDataApi.delete(ACTIVE_OU_CODE);
			} catch {
				// ignore
			}
			return;
		}
		await userDataApi.upsert({ code: ACTIVE_OU_CODE, value: ouId });
	}, []);

	return { activeOuId, setActiveOuId, restored };
}
