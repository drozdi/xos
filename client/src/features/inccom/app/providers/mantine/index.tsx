import type { ReactNode } from 'react';

/** Legacy IncCom provider — оболочка больше не нужна: Ant/Mantine на корневом App. */
export function ProviderMantine({ children }: { children: ReactNode }) {
	return children;
}
