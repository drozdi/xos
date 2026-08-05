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

import { destroyCoreApi } from '@/core/context/coreApiRegistry';

import { HKEY_CONFIG_DEFAULTS } from '@/config/defaults';
import { WindowContextMenu } from '@/core/contextMenu';

import { destroyWindowApi, getOrCreateWindowApi } from './WindowApi';
import { useWindowManagerViewport } from './WindowManagerContext';
import { useChildWindowStore } from './childWindowStore';
import { useWindowAutoSize } from './useWindowAutoSize';
import { WindowSizeContext } from './useWindowSize';
import { useWmStore } from './useWmStore';
import { emitWindowFocus, emitWindowResize, getWindowApi } from './windowApiRegistry';
import {
	buildDragCancelSelector,
	resolveWindowDragConfig,
	XOS_WINDOW_DRAG_HANDLE_CLASS,
	XOS_WINDOW_NO_DRAG_CLASS,
	XOS_WINDOW_TITLEBAR_CLASS,
} from './windowDrag';
import { getWindowDragBounds } from './windowDragBounds';

const ChildWindowPortal = lazy(() =>
	import('./ChildWindowPortal').then((module) => ({ default: module.ChildWindowPortal })),
);

function ChildWindowPortalGate({ windowId }: { windowId: string }) {
	const hasChildren = useChildWindowStore(
		(state) => (state.byParent[windowId]?.length ?? 0) > 0,
	);

	if (!hasChildren) {
		return null;
	}

	return (
		<Suspense fallback={null}>
			<ChildWindowPortal windowId={windowId} />
		</Suspense>
	);
}

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
	const rndRef = useRef<Rnd>(null);
	const shellRef = useRef<HTMLDivElement>(null);
	const contentRef = useRef<HTMLDivElement>(null);
	const titlebarHeight = isMobile ? 44 : 36;
	const contentSizeValue = useMemo(() => {
		if (!windowState) {
			return { width: 0, height: 0 };
		}
		return {
			width: windowState.width,
			height: Math.max(0, windowState.height - titlebarHeight),
		};
	}, [titlebarHeight, windowState?.height, windowState?.width]);

	const dragConfig = useMemo(
		() =>
			resolveWindowDragConfig({
				dragHandles: windowState?.dragHandles,
				dragCancel: windowState?.dragCancel,
			}),
		[windowState?.dragCancel, windowState?.dragHandles],
	);
	const dragCancelSelector = useMemo(
		() => buildDragCancelSelector(dragConfig.dragCancel),
		[dragConfig.dragCancel],
	);

	useEffect(() => {
		const root = shellRef.current;
		if (!root) {
			return undefined;
		}

		const marked = new Set<Element>();
		for (const selector of dragConfig.dragHandles) {
			root.querySelectorAll(selector).forEach((element) => {
				element.classList.add(XOS_WINDOW_DRAG_HANDLE_CLASS);
				marked.add(element);
			});
		}

		return () => {
			marked.forEach((element) => {
				element.classList.remove(XOS_WINDOW_DRAG_HANDLE_CLASS);
			});
		};
	}, [dragConfig.dragHandles, windowState?.contentKey]);

	useEffect(() => {
		getOrCreateWindowApi(windowId);
		return () => {
			destroyWindowApi(windowId);
			destroyCoreApi(windowId);
		};
	}, [windowId]);

	useEffect(() => {
		if (contentSizeValue.width === 0 && contentSizeValue.height === 0) {return;}

		const timer = window.setTimeout(() => {
			emitWindowResize(windowId);
		}, 150);

		return () => {
			window.clearTimeout(timer);
		};
	}, [contentSizeValue.width, contentSizeValue.height, windowId]);

	useEffect(() => {
		if (activeWindowId === windowId) {
			emitWindowFocus(windowId);
		}
	}, [activeWindowId, windowId]);

	const taskbarHeight = HKEY_CONFIG_DEFAULTS.taskbar.height;
	const { minWidth, minHeight, dragMargin } = HKEY_CONFIG_DEFAULTS.window;
	const viewport = useWindowManagerViewport();

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

	const desktopMaxBounds = mobileBounds;

	const isMaximizedLayout = Boolean(isMobile || windowState?.maximized);
	const resizable = windowState?.resizable ?? true;
	const positionFixed = windowState?.positionFixed ?? false;
	const autoSize = windowState?.autoSize ?? false;

	useWindowAutoSize({
		windowId,
		appId: windowState?.appId ?? '',
		contentRef,
		titlebarHeight,
		autoSize: isMaximizedLayout || windowState?.minimized ? false : autoSize,
		contentKey: windowState?.contentKey,
	});

	useEffect(() => {
		if (!autoSize || isMaximizedLayout || !windowState) {
			return;
		}
		rndRef.current?.updateSize({
			width: windowState.width,
			height: windowState.height,
		});
	}, [autoSize, isMaximizedLayout, windowState?.height, windowState?.width]);

	const boundsReady = viewport.width > 0 && viewport.height > 0;
	const dragBounds = useMemo(() => {
		if (!windowState || isMaximizedLayout || !boundsReady) {
			return undefined;
		}
		return getWindowDragBounds(
			viewport,
			{ width: windowState.width, height: windowState.height },
			dragMargin,
		);
	}, [
		boundsReady,
		dragMargin,
		isMaximizedLayout,
		viewport.height,
		viewport.width,
		windowState?.height,
		windowState?.width,
	]);
	const clampDragPosition = useCallback(
		(x: number, y: number) => {
			if (!dragBounds) {
				return { x, y };
			}
			return {
				x: Math.min(dragBounds.right, Math.max(dragBounds.left, x)),
				y: Math.min(dragBounds.bottom, Math.max(dragBounds.top, y)),
			};
		},
		[dragBounds],
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
			if (isMobile || windowState?.maximized || windowState?.positionFixed) {return;}
			const nextPosition = clampDragPosition(data.x, data.y);
			if (
				nextPosition.x !== data.x ||
				nextPosition.y !== data.y
			) {
				rndRef.current?.updatePosition(nextPosition);
			}
			if (
				windowState &&
				nextPosition.x === windowState.x &&
				nextPosition.y === windowState.y
			) {
				return;
			}
			updateWindow(windowId, nextPosition);
			emitWindowResize(windowId);
		},
		[clampDragPosition, isMobile, updateWindow, windowId, windowState],
	);

	const handleResizeStop = useCallback(
		(
			_event: unknown,
			_direction: unknown,
			ref: HTMLElement,
			_delta: unknown,
			position: { x: number; y: number },
		) => {
			if (isMobile || windowState?.maximized || !windowState?.resizable) {return;}
			const nextWidth = ref.offsetWidth;
			const nextHeight = ref.offsetHeight;
			const nextPosition = clampDragPosition(position.x, position.y);
			if (
				nextPosition.x !== position.x ||
				nextPosition.y !== position.y
			) {
				rndRef.current?.updatePosition(nextPosition);
			}
			if (
				windowState &&
				nextPosition.x === windowState.x &&
				nextPosition.y === windowState.y &&
				nextWidth === windowState.width &&
				nextHeight === windowState.height
			) {
				return;
			}
			updateWindow(windowId, {
				x: nextPosition.x,
				y: nextPosition.y,
				width: nextWidth,
				height: nextHeight,
			});
			emitWindowResize(windowId);
		},
		[clampDragPosition, isMobile, updateWindow, windowId, windowState],
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

	const rndKey = windowState
		? `${windowState.contentKey}-${isMaximizedLayout ? 'max' : 'free'}-${isMobile ? 'mob' : 'desk'}`
		: 'missing';
	const defaultBounds = useMemo(
		() => {
			if (!windowState) {
				return { x: 0, y: 0, width: 0, height: 0 };
			}
			if (isMaximizedLayout) {
				return {
					x: 0,
					y: 0,
					width: isMobile ? mobileBounds.width : desktopMaxBounds.width,
					height: isMobile ? mobileBounds.height : desktopMaxBounds.height,
				};
			}
			return {
				x: windowState.x,
				y: windowState.y,
				width: windowState.width,
				height: windowState.height,
			};
		},
		[
			desktopMaxBounds.height,
			desktopMaxBounds.width,
			isMaximizedLayout,
			isMobile,
			mobileBounds.height,
			mobileBounds.width,
			rndKey,
			windowState?.height,
			windowState?.width,
			windowState?.x,
			windowState?.y,
		],
	);

	if (!windowState) {return null;}

	const controlSize = isMobile ? 44 : 36;
	const canDrag = !isMaximizedLayout && !positionFixed;
	const canResize = !isMaximizedLayout && resizable;

	return (
		<Rnd
			ref={rndRef}
			key={rndKey}
			default={defaultBounds}
			minWidth={isMobile ? mobileBounds.width : minWidth}
			minHeight={isMobile ? mobileBounds.height : minHeight}
			dragHandleClassName={XOS_WINDOW_DRAG_HANDLE_CLASS}
			cancel={dragCancelSelector}
			disableDragging={!canDrag}
			enableResizing={canResize}
			enableUserSelectHack={false}
			style={{
				zIndex: windowState.zIndex,
				pointerEvents: 'auto',
				display: 'flex',
				flexDirection: 'column',
				willChange: isDragging ? 'transform' : undefined,
			}}
			onDragStart={handleDragStart}
			onResizeStart={handleFocus}
			onDragStop={handleDragStop}
			onResizeStop={handleResizeStop}
		>
			<Box
				ref={shellRef}
				data-xos-window-id={windowId}
				style={{
					display: 'flex',
					flexDirection: 'column',
					height: '100%',
					backgroundColor: 'var(--xos-window-bg)',
					color: 'var(--xos-window-text)',
					border: '1px solid var(--xos-window-border)',
					borderRadius: 0,
					boxShadow: 'var(--xos-window-shadow)',
					overflow: 'hidden',
				}}
			>
				<Group
					className={`${XOS_WINDOW_TITLEBAR_CLASS} ${XOS_WINDOW_DRAG_HANDLE_CLASS}`}
					gap={0}
					wrap="nowrap"
					justify="space-between"
					style={{
						flexShrink: 0,
						height: isMobile ? 44 : 36,
						cursor: canDrag ? 'move' : 'default',
						background: 'var(--xos-window-titlebar-bg)',
						borderBottom: '1px solid var(--xos-window-titlebar-border)',
						color: 'var(--xos-window-text)',
						userSelect: 'none',
						paddingLeft: 12,
						paddingRight: 0,
					}}
					onMouseDown={handleFocus}
				>
					<Text size="sm" fw={500} truncate style={{ flex: 1, minWidth: 0 }} c="inherit" pr="xs">
						{windowState.title}
					</Text>
					<Group gap={0} wrap="nowrap" style={{ height: '100%' }}>
						<WindowControl
							label="Minimize"
							size={controlSize}
							onClick={handleMinimize}
						>
							−
						</WindowControl>
						{!positionFixed ? (
							<WindowControl
								label={windowState.maximized && !isMobile ? 'Restore' : 'Maximize'}
								size={controlSize}
								onClick={handleMaximizeToggle}
							>
								{windowState.maximized && !isMobile ? '⧉' : '□'}
							</WindowControl>
						) : null}
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

				<WindowSizeContext.Provider value={contentSizeValue}>
					<Box
						ref={contentRef}
						data-window-width={contentSizeValue.width}
						data-window-height={contentSizeValue.height}
						style={{
							position: 'relative',
							flex: autoSize ? '0 0 auto' : 1,
							minHeight: autoSize ? undefined : 0,
							overflow: autoSize ? 'hidden' : 'auto',
							['--window-width' as string]: `${contentSizeValue.width}px`,
							['--window-height' as string]: `${contentSizeValue.height}px`,
						}}
					>
						<WindowContextMenu windowId={windowId} windowState={windowState}>
							<Box data-xos-window-content style={{ minHeight: autoSize ? undefined : '100%' }}>
								{children}
								<ChildWindowPortalGate windowId={windowId} />
							</Box>
						</WindowContextMenu>
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
			className={XOS_WINDOW_NO_DRAG_CLASS}
			variant='subtle'
			color={variant === 'close' ? 'red' : 'gray'}
			radius={0}
			size={size}
			style={{
				height: '100%',
				width: size,
				minWidth: size,
				minHeight: '100%',
				borderRadius: 0,
			}}
			onClick={onClick}
		>
			{children}
		</ActionIcon>
	);
});

export const Window = memo(WindowComponent);
