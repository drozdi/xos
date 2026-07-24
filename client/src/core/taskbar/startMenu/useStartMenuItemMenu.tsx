import {
	useCallback,
	useEffect,
	useMemo,
	useState,
	type MouseEvent as ReactMouseEvent,
	type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';

export const START_MENU_CONTEXT_ATTR = 'data-start-menu-context';
export const START_MENU_ROOT_ATTR = 'data-start-menu-root';

export interface StartMenuItemMenuEntry {
	id: string;
	label: string;
	disabled?: boolean;
	onClick: () => void;
}

export function useStartMenuItemMenu(items: StartMenuItemMenuEntry[]) {
	const [opened, setOpened] = useState(false);
	const [anchorPoint, setAnchorPoint] = useState({ x: 0, y: 0 });
	const visibleItems = useMemo(() => items, [items]);

	const open = useCallback(() => setOpened(true), []);
	const close = useCallback(() => setOpened(false), []);

	const onContextMenu = useCallback(
		(event: ReactMouseEvent) => {
			if (visibleItems.length === 0) {
				return;
			}
			event.preventDefault();
			event.stopPropagation();
			setAnchorPoint({ x: event.clientX, y: event.clientY });
			open();
		},
		[open, visibleItems.length],
	);

	useEffect(() => {
		if (!opened) {
			return;
		}

		const handlePointerDown = (event: PointerEvent) => {
			const target = event.target as Element | null;
			if (target?.closest(`[${START_MENU_CONTEXT_ATTR}]`)) {
				return;
			}
			close();
		};

		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === 'Escape') {
				close();
			}
		};

		document.addEventListener('pointerdown', handlePointerDown, true);
		document.addEventListener('keydown', handleKeyDown, true);
		return () => {
			document.removeEventListener('pointerdown', handlePointerDown, true);
			document.removeEventListener('keydown', handleKeyDown, true);
		};
	}, [opened, close]);

	const menu: ReactNode =
		opened && typeof document !== 'undefined'
			? createPortal(
					<div
						data-start-menu-context=""
						style={{
							position: 'fixed',
							left: anchorPoint.x,
							top: anchorPoint.y,
							zIndex: 2200,
							minWidth: 220,
							padding: 4,
							borderRadius: 8,
							border: '1px solid var(--xos-shell-border)',
							background: 'var(--xos-shell-bg)',
							boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
						}}
						onPointerDown={(event) => {
							event.stopPropagation();
						}}
						onMouseDown={(event) => {
							event.stopPropagation();
						}}
					>
						<div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
							{visibleItems.map((item) => (
								<button
									key={item.id}
									type="button"
									disabled={item.disabled}
									onClick={(event) => {
										event.preventDefault();
										event.stopPropagation();
										if (item.disabled) {
											return;
										}
										close();
										item.onClick();
									}}
									style={{
										display: 'block',
										width: '100%',
										padding: '8px 10px',
										borderRadius: 4,
										textAlign: 'left',
										fontSize: 13,
										color: item.disabled
											? 'rgba(0, 0, 0, 0.45)'
											: 'var(--xos-shell-text)',
										cursor: item.disabled ? 'default' : 'pointer',
										opacity: item.disabled ? 0.6 : 1,
										background: 'transparent',
										border: 'none',
									}}
									onMouseEnter={(e) => {
										if (!item.disabled) {
											e.currentTarget.style.background = 'var(--xos-shell-hover)';
										}
									}}
									onMouseLeave={(e) => {
										e.currentTarget.style.background = 'transparent';
									}}
								>
									{item.label}
								</button>
							))}
						</div>
					</div>,
					document.body,
				)
			: null;

	return { onContextMenu, menu };
}
