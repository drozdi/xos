import { Paper, Stack, UnstyledButton } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
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
	const [opened, { open, close }] = useDisclosure(false);
	const [anchorPoint, setAnchorPoint] = useState({ x: 0, y: 0 });
	const visibleItems = useMemo(() => items, [items]);

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
					<Paper
						data-start-menu-context=""
						shadow="md"
						withBorder
						p={4}
						style={{
							position: 'fixed',
							left: anchorPoint.x,
							top: anchorPoint.y,
							zIndex: 2200,
							minWidth: 220,
						}}
						onPointerDown={(event) => {
							event.stopPropagation();
						}}
						onMouseDown={(event) => {
							event.stopPropagation();
						}}
					>
						<Stack gap={2}>
							{visibleItems.map((item) => (
								<UnstyledButton
									key={item.id}
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
										fontSize: 'var(--mantine-font-size-sm)',
										color: item.disabled
											? 'var(--mantine-color-dimmed)'
											: 'var(--xos-shell-text)',
										cursor: item.disabled ? 'default' : 'pointer',
										opacity: item.disabled ? 0.6 : 1,
									}}
									styles={{
										root: {
											'&:hover': item.disabled
												? undefined
												: { background: 'var(--xos-shell-hover)' },
										},
									}}
								>
									{item.label}
								</UnstyledButton>
							))}
						</Stack>
					</Paper>,
					document.body,
				)
			: null;

	return { onContextMenu, menu };
}
