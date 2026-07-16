import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
	type ReactNode,
} from 'react';

import type { AppMenuEntry } from './types';

interface AppMenuRuntimeContextValue {
	extraItems: AppMenuEntry[];
	registerExtraItems: (items: AppMenuEntry[]) => () => void;
}

const AppMenuRuntimeContext = createContext<AppMenuRuntimeContextValue | null>(null);

export function AppMenuRuntimeProvider({ children }: { children: ReactNode }) {
	const [extraItems, setExtraItems] = useState<AppMenuEntry[]>([]);

	const registerExtraItems = useCallback((items: AppMenuEntry[]) => {
		const ids = new Set(
			items.map((item) => ('id' in item ? item.id : item.type)),
		);
		setExtraItems((current) => [...current, ...items]);
		return () => {
			setExtraItems((current) =>
				current.filter((item) => {
					const key = 'id' in item ? item.id : item.type;
					return !ids.has(key);
				}),
			);
		};
	}, []);

	const value = useMemo(
		() => ({ extraItems, registerExtraItems }),
		[extraItems, registerExtraItems],
	);

	return (
		<AppMenuRuntimeContext.Provider value={value}>
			{children}
		</AppMenuRuntimeContext.Provider>
	);
}

export function useAppMenuRuntime(): AppMenuRuntimeContextValue {
	const context = useContext(AppMenuRuntimeContext);
	if (!context) {
		throw new Error('useAppMenuRuntime must be used within AppMenuRuntimeProvider');
	}
	return context;
}

/** Добавить пункты меню из компонента приложения (снимаются при unmount) */
export function useAppMenuItems(items: AppMenuEntry[]): void {
	const { registerExtraItems } = useAppMenuRuntime();

	useEffect(() => {
		return registerExtraItems(items);
	}, [items, registerExtraItems]);
}
