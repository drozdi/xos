import { ActionIcon, Box, Group, Text } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import {
	lazy,
	memo,
	Suspense,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
	type MouseEvent,
	type ReactNode,
} from 'react';
import { Rnd } from 'react-rnd';

import { HKEY_CONFIG_DEFAULTS } from '@/config/defaults';

import { getOrCreateWindowApi, destroyWindowApi } from './WindowApi';
import { emitWindowFocus, emitWindowResize, getWindowApi } from './windowApiRegistry';
import { useObserveWindowSize, WindowSizeContext } from './useWindowSize';
import { useWmStore } from './useWmStore';

const ChildWindowPortal = lazy(() =>
	import('./ChildWindowPortal').then((module) => ({ default: module.ChildWindowPortal })),
);

interface WindowProps {
	windowId: string;
	children: ReactNode;
}

const MOBILE_BREAKPOINT = '(max-width: 767px)';

function WindowComponent({ windowId, children }: WindowProps) {
	const windowState = useWmStore((state) => state.windows[windowId]);
	const focusWindow = useWmStore((state) => state.focusWindow);
	const updateWindow = useWmStore((state) => state.updateWindow);
	const minimizeWindow = useWmStore((state) => state.minimizeWindow);
	const maximizeWindow = useWmStore((state) => state.maximizeWindow);
	const restoreWindow = useWmStore((state) => state.restoreWindow);
	const activeWindowId = useWmStore((state) => state.activeWindowId);

	const isMobile = useMediaQuery(MOBILE_BREAKPOINT, false, { getInitialValueInEffect: true });
	const [isDragging, setIsDragging] = useState(false);
	const contentRef = useRef<HTMLDivElement>(null);
	const contentSize = useObserveWindowSize(contentRef);

	useEffect(() => {
		getOrCreateWindowApi(windowId);
		return () => {
			destroyWindowApi(windowId);
		};
	}, [windowId]);

	useEffect(() => {
		if (contentSize.width === 0 && contentSize.height === 0) {return;}

		const timer = window.setTimeout(() => {
			emitWindowResize(windowId);
		}, 150);

		return () => {
			window.clearTimeout(timer);
		};
	}, [contentSize.width, contentSize.height, windowId]);

	useEffect(() => {
		if (activeWindowId === windowId) {
			emitWindowFocus(windowId);
		}
	}, [activeWindowId, windowId]);

	const taskbarHeight = HKEY_CONFIG_DEFAULTS.taskbar.height;
	const { minWidth, minHeight } = HKEY_CONFIG_DEFAULTS.window;

	const mobileBounds = useMemo(
		() => ({
			x: 0,
			y: 0,
			width: typeof window !== 'undefined' ? window.innerWidth : 0,
			height:
				typeof window !== 'undefined'
					? Math.max(0, window.innerHeight - taskbarHeight)
					: 0,
		}),
		[taskbarHeight],
	);

	const desktopMaxBounds = useMemo(
		() => ({
			x: 0,
			y: 0,
			width: typeof window !== 'undefined' ? window.innerWidth : 0,
			height:
				typeof window !== 'undefined'
					? Math.max(0, window.innerHeight - taskbarHeight)
					: 0,
		}),
		[taskbarHeight],
	);

	const handleFocus = useCallback(() => {
		focusWindow(windowId);
	}, [focusWindow, windowId]);

	const handleDragStart = useCallback(() => {
		setIsDragging(true);
		handleFocus();
	}, [handleFocus]);

	const handleDragStop = useCallback(
		(_event: unknown, data: { x: number; y: number }) => {
			setIsDragging(false);
			if (isMobile || windowState?.maximized) {return;}
			updateWindow(windowId, { x: data.x, y: data.y });
			emitWindowResize(windowId);
		},
		[isMobile, updateWindow, windowId, windowState?.maximized],
	);

	const handleResizeStop = useCallback(
		(
			_event: unknown,
			_direction: unknown,
			ref: HTMLElement,
			_delta: unknown,
			position: { x: number; y: number },
		) => {
			if (isMobile || windowState?.maximized) {return;}
			updateWindow(windowId, {
				x: position.x,
				y: position.y,
				width: ref.offsetWidth,
				height: ref.offsetHeight,
			});
			emitWindowResize(windowId);
		},
		[isMobile, updateWindow, windowId, windowState?.maximized],
	);

	const handleMinimize = useCallback(
		(event: MouseEvent) => {
			event.stopPropagation();
			minimizeWindow(windowId);
		},
		[minimizeWindow, windowId],
	);

	const handleMaximizeToggle = useCallback(
		(event: MouseEvent) => {
			event.stopPropagation();
			if (windowState?.maximized && !isMobile) {
				restoreWindow(windowId);
				return;
			}
			maximizeWindow(windowId, isMobile ? mobileBounds : desktopMaxBounds);
		},
		[
			desktopMaxBounds,
			isMobile,
			maximizeWindow,
			mobileBounds,
			restoreWindow,
			windowId,
			windowState?.maximized,
		],
	);

	const handleClose = useCallback(
		(event: MouseEvent) => {
			event.stopPropagation();
			void getWindowApi(windowId)?.close();
		},
		[windowId],
	);

	if (!windowState) {return null;}

	const controlSize = isMobile ? 36 : 28;
	const isMaximizedLayout = isMobile || windowState.maximized;
	const position = isMobile || windowState.maximized
		? { x: 0, y: 0 }
		: { x: windowState.x, y: windowState.y };
	const size = isMobile
		? { width: mobileBounds.width, height: mobileBounds.height }
		: windowState.maximized
			? { width: desktopMaxBounds.width, height: desktopMaxBounds.height }
			: { width: windowState.width, height: windowState.height };

	return (
		<Rnd
			position={position}
			size={size}
			minWidth={isMobile ? mobileBounds.width : minWidth}
			minHeight={isMobile ? mobileBounds.height : minHeight}
			bounds="parent"
			dragHandleClassName="xos-window-titlebar"
			disableDragging={isMaximizedLayout}
			enableResizing={!isMaximizedLayout}
			enableUserSelectHack={false}
			style={{
				zIndex: windowState.zIndex,
				display: 'flex',
				flexDirection: 'column',
				willChange: isDragging ? 'transform' : undefined,
			}}
			onDragStart={handleDragStart}
			onResizeStart={handleFocus}
			onDragStop={handleDragStop}
			onResizeStop={handleResizeStop}
			onMouseDown={handleFocus}
		>
			<Box
				bg="gray.0"
				style={{
					display: 'flex',
					flexDirection: 'column',
					height: '100%',
					border: '1px solid var(--mantine-color-gray-4)',
					borderRadius: isMobile ? 0 : 8,
					boxShadow: 'var(--mantine-shadow-md)',
					overflow: 'hidden',
				}}
			>
				<Group
					className="xos-window-titlebar"
					gap="xs"
					px="sm"
					justify="space-between"
					style={{
						flexShrink: 0,
						height: isMobile ? 44 : 36,
						cursor: isMaximizedLayout ? 'default' : 'move',
						background: 'var(--mantine-color-gray-1)',
						borderBottom: '1px solid var(--mantine-color-gray-3)',
						userSelect: 'none',
					}}
					onMouseDown={handleFocus}
				>
					<Text size="sm" fw={500} truncate style={{ flex: 1 }}>
						{windowState.title}
					</Text>
					<Group gap={4} wrap="nowrap">
						<WindowControl
							label="Minimize"
							size={controlSize}
							onClick={handleMinimize}
						>
							−
						</WindowControl>
						<WindowControl
							label={windowState.maximized && !isMobile ? 'Restore' : 'Maximize'}
							size={controlSize}
							onClick={handleMaximizeToggle}
						>
							{windowState.maximized && !isMobile ? '⧉' : '□'}
						</WindowControl>
						<WindowControl
							label="Close"
							size={controlSize}
							variant="close"
							onClick={handleClose}
						>
							×
						</WindowControl>
					</Group>
				</Group>

				<WindowSizeContext.Provider value={contentSize}>
					<Box
						ref={contentRef}
						p="md"
						data-window-width={contentSize.width}
						data-window-height={contentSize.height}
						style={{
							position: 'relative',
							flex: 1,
							overflow: 'auto',
							['--window-width' as string]: `${contentSize.width}px`,
							['--window-height' as string]: `${contentSize.height}px`,
						}}
						onMouseDown={handleFocus}
					>
						{children}
						<Suspense fallback={null}>
							<ChildWindowPortal windowId={windowId} />
						</Suspense>
					</Box>
				</WindowSizeContext.Provider>
			</Box>
		</Rnd>
	);
}

interface WindowControlProps {
	label: string;
	size: number;
	onClick: (event: MouseEvent) => void;
	children: ReactNode;
	variant?: 'default' | 'close';
}

const WindowControl = memo(({
	label,
	size,
	onClick,
	children,
	variant = 'default',
}: WindowControlProps) => {
	return (
		<ActionIcon
			aria-label={label}
			variant="subtle"
			color={variant === 'close' ? 'red' : 'gray'}
			size={size}
			onClick={onClick}
		>
			{children}
		</ActionIcon>
	);
});

export const Window = memo(WindowComponent);
