import { useCallback, useEffect, useRef, useState } from 'react';

import { userDataApi } from '@/core/api/endpoints/userData';

import {
	DEFAULT_PKB_SIDEBAR_WIDTH,
	PKB_PREFS,
	pkbLastVaultIdSchema,
	pkbSidebarWidthSchema,
} from '../pkbPrefs';

export function usePkbUiPrefs() {
	const [sidebarWidth, setSidebarWidthState] = useState(DEFAULT_PKB_SIDEBAR_WIDTH);
	const [restored, setRestored] = useState(false);
	const sidebarWidthRef = useRef(sidebarWidth);

	useEffect(() => {
		let cancelled = false;

		void (async () => {
			try {
				const dto = await userDataApi.getOptional(PKB_PREFS.sidebarWidth);
				if (!cancelled && dto) {
					const width = pkbSidebarWidthSchema.parse(dto.value);
					setSidebarWidthState(width);
					sidebarWidthRef.current = width;
				}
			} catch {
				// keep default
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

	useEffect(() => {
		if (!restored) {
			return;
		}
		const timer = window.setTimeout(() => {
			sidebarWidthRef.current = sidebarWidth;
			void userDataApi.upsert({
				code: PKB_PREFS.sidebarWidth,
				value: sidebarWidth,
			});
		}, 500);

		return () => window.clearTimeout(timer);
	}, [restored, sidebarWidth]);

	const setSidebarWidth = useCallback((width: number) => {
		const clamped = Math.max(150, Math.min(600, width));
		setSidebarWidthState(clamped);
	}, []);

	return {
		sidebarWidth,
		setSidebarWidth,
		restored,
	};
}

export async function saveLastVaultId(vaultId: number): Promise<void> {
	pkbLastVaultIdSchema.parse(vaultId);
	await userDataApi.upsert({ code: PKB_PREFS.lastVaultId, value: vaultId });
}

export async function loadLastVaultId(): Promise<number | null> {
	const dto = await userDataApi.getOptional(PKB_PREFS.lastVaultId);
	if (!dto) {
		return null;
	}
	try {
		return pkbLastVaultIdSchema.parse(dto.value);
	} catch {
		return null;
	}
}
