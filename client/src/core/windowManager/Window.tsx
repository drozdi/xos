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

import { AppRegistry } from '@/core/appManager/AppRegistry';
import { destroyCoreApi } from '@/core/context/coreApiRegistry';
import { DESKTOP_WIDGET_SNAP_KEY, snapWidgetPoint } from '@/core/desktop/desktopWidgets';
import { widgetSurfaceStyle } from '@/core/desktop/WidgetSurface';
import { useSetting } from '@/core/settings/hooks';

import { HKEY_CONFIG_DEFAULTS } from '@/config/defaults';
import { WindowContextMenu } from '@/core/contextMenu';

import { destroyWindowApi, getOrCreateWindowApi } from './WindowApi';
import { useWindowManagerViewport } from './WindowManagerContext';
import { useChildWindowStore } from './childWindowStore';
import { useWindowAutoSize } from './useWindowAutoSize';
import { WindowSizeContext } from './useWindowSize';
import { useWmStore } from './useWmStore';
import {
	emitWindowDragStart,
	emitWindowFocus,
	emitWindowResize,
	getWindowApi,
} from './windowApiRegistry';
import {
	buildDragCancelSelector,
	resolveWindowDragConfig,
	XOS_WINDOW_DRAG_HANDLE_CLASS,
	XOS_WINDOW_NO_DRAG_CLASS,
	XOS_WINDOW_TITLEBAR_CLASS,
} from './windowDrag';
import {
	fitRectToDesktop,
	getContainedDragBounds,
	getWindowDragBounds,
	snapAppToDesktopEdges,
} from './windowDragBounds';
import { getMaximizedBounds } from './windowLayout';

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
/** Emit window `dragStart` only after the window moved this many px (click ≠ drag). */
const DRAG_START_EMIT_PX = 5;

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
	const [widgetControlsVisible, setWidgetControlsVisible] = useState(false);
	const rndRef = useRef<Rnd>(null);
	const shellRef = useRef<HTMLDivElement>(null);
	const contentRef = useRef<HTMLDivElement>(null);
	/** Rnd fires onDragStart on mousedown; emit app `dragStart` only after real move. */
	const dragOriginRef = useRef<{ x: number; y: number } | null>(null);
	const dragStartEmittedRef = useRef(false);
	const isWidget = windowState?.shellRole === 'widget';
	const [widgetSnap] = useSetting<boolean>('USER', DESKTOP_WIDGET_SNAP_KEY, false);
	const titlebarHeight = isWidget ? 0 : isMobile ? 44 : 36;
	const taskbarHeight = HKEY_CONFIG_DEFAULTS.taskbar.height;
	const { minWidth, minHeight, dragMargin } = HKEY_CONFIG_DEFAULTS.window;
	const viewport = useWindowManagerViewport();

	const mobileBounds = useMemo(
		() => ({
			x: 0,
			y: 0,
			width: viewport.width > 0 ? viewport.width : typeof window !== 'undefined' ? window.innerWidth : 0,
			height:
				viewport.height > 0
					? viewport.height
					: typeof window !== 'undefined'
						? Math.max(0, window.innerHeight - taskbarHeight)
						: 0,
		}),
		[taskbarHeight, viewport.height, viewport.width],
	);

	const desktopMaxBounds = useMemo(() => getMaximizedBounds(viewport), [viewport.height, viewport.width]);

	const isMaximizedLayout = Boolean(isMobile || windowState?.maximized);
	const contentSizeValue = useMemo(() => {
		if (!windowState) {
			return { width: 0, height: 0 };
		}
		if (isMaximizedLayout) {
			const bounds = isMobile ? mobileBounds : desktopMaxBounds;
			return {
				width: bounds.width,
				height: Math.max(0, bounds.height - titlebarHeight),
			};
		}
		return {
			width: windowState.width,
			height: Math.max(0, windowState.height - titlebarHeight),
		};
	}, [
		desktopMaxBounds.height,
		desktopMaxBounds.width,
		isMaximizedLayout,
		isMobile,
		mobileBounds.height,
		mobileBounds.width,
		titlebarHeight,
		windowState?.height,
		windowState?.width,
	]);

	const dragConfig = useMemo(
		() =>
			resolveWindowDragConfig(
				isWidget
					? {
							dragHandles: ['.xos-widget-shell'],
							dragCancel: [
								`.${XOS_WINDOW_NO_DRAG_CLASS}`,
								'button',
								'input',
								'textarea',
								'select',
								'a',
								'[role="button"]',
								'[contenteditable="true"]',
							],
						}
					: {
							dragHandles: windowState?.dragHandles,
							dragCancel: windowState?.dragCancel,
						},
			),
		[isWidget, windowState?.dragCancel, windowState?.dragHandles],
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

	const boundsReady = viewport.width > 0 && viewport.height > 0;

	useEffect(() => {
		if (!windowState || isMaximizedLayout || !boundsReady) {
			return;
		}
		rndRef.current?.updateSize({
			width: windowState.width,
			height: windowState.height,
		});
		rndRef.current?.updatePosition({ x: windowState.x, y: windowState.y });
		emitWindowResize(windowId);
	}, [
		boundsReady,
		isMaximizedLayout,
		windowId,
		windowState?.height,
		windowState?.width,
		windowState?.x,
		windowState?.y,
	]);

	// Widgets: re-sync Rnd after lazy/content paint (otherwise UI stays on skeleton until hover).
	useEffect(() => {
		if (!isWidget || !windowState || isMaximizedLayout || !boundsReady) {
			return;
		}
		const outer = contentRef.current;
		if (!outer) {
			return;
		}
		const sync = () => {
			rndRef.current?.updateSize({
				width: windowState.width,
				height: windowState.height,
			});
		};
		const ro = new ResizeObserver(() => {
			sync();
		});
		ro.observe(outer);
		const mo = new MutationObserver(() => {
			sync();
		});
		mo.observe(outer, { childList: true, subtree: true });
		sync();
		return () => {
			ro.disconnect();
			mo.disconnect();
		};
	}, [
		boundsReady,
		isMaximizedLayout,
		isWidget,
		windowId,
		windowState?.height,
		windowState?.width,
	]);

	useEffect(() => {
		if (!windowState?.maximized || isMobile || !boundsReady) {
			return;
		}
		const bounds = desktopMaxBounds;
		rndRef.current?.updateSize({ width: bounds.width, height: bounds.height });
		rndRef.current?.updatePosition({ x: bounds.x, y: bounds.y });
		emitWindowResize(windowId);
	}, [
		boundsReady,
		desktopMaxBounds.height,
		desktopMaxBounds.width,
		isMobile,
		windowId,
		windowState?.maximized,
	]);
	const dragBounds = useMemo(() => {
		if (!windowState || isMaximizedLayout || !boundsReady) {
			return undefined;
		}
		const size = { width: windowState.width, height: windowState.height };
		if (isWidget) {
			return getContainedDragBounds(viewport, size);
		}
		return getWindowDragBounds(viewport, size, dragMargin);
	}, [
		boundsReady,
		dragMargin,
		isMaximizedLayout,
		isWidget,
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

	useEffect(() => {
		if (!isWidget || !windowState || !dragBounds) {
			return;
		}
		const next = clampDragPosition(windowState.x, windowState.y);
		if (next.x === windowState.x && next.y === windowState.y) {
			return;
		}
		updateWindow(windowId, next);
		rndRef.current?.updatePosition(next);
	}, [
		clampDragPosition,
		dragBounds,
		isWidget,
		updateWindow,
		windowId,
		windowState?.x,
		windowState?.y,
	]);

	const handleFocus = useCallback(() => {
		focusWindow(windowId);
	}, [focusWindow, windowId]);

	const handleDragStart = useCallback(
		(_event: unknown, data: { x: number; y: number }) => {
			setIsDragging(true);
			handleFocus();
			dragOriginRef.current = { x: data.x, y: data.y };
			dragStartEmittedRef.current = false;
		},
		[handleFocus],
	);

	const handleDrag = useCallback(
		(_event: unknown, data: { x: number; y: number }) => {
			if (dragStartEmittedRef.current || !dragOriginRef.current) {
				return;
			}
			const dx = data.x - dragOriginRef.current.x;
			const dy = data.y - dragOriginRef.current.y;
			if (dx * dx + dy * dy < DRAG_START_EMIT_PX * DRAG_START_EMIT_PX) {
				return;
			}
			dragStartEmittedRef.current = true;
			emitWindowDragStart(windowId);
		},
		[windowId],
	);

	const handleDragStop = useCallback(
		(_event: unknown, data: { x: number; y: number }) => {
			setIsDragging(false);
			dragOriginRef.current = null;
			dragStartEmittedRef.current = false;
			if (isMobile || windowState?.maximized || windowState?.positionFixed) {return;}
			const snappedPoint = snapWidgetPoint(data.x, data.y, isWidget && widgetSnap === true);
			const nextPosition = clampDragPosition(snappedPoint.x, snappedPoint.y);
			if (!isWidget && windowState && viewport.width > 0 && viewport.height > 0) {
				const edgeSnap = snapAppToDesktopEdges(viewport, nextPosition, {
					width: windowState.width,
					height: windowState.height,
				});
				if (edgeSnap) {
					rndRef.current?.updatePosition({ x: edgeSnap.x, y: edgeSnap.y });
					rndRef.current?.updateSize({ width: edgeSnap.width, height: edgeSnap.height });
					updateWindow(windowId, edgeSnap);
					emitWindowResize(windowId);
					return;
				}
			}
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
		[clampDragPosition, isMobile, isWidget, updateWindow, viewport.height, viewport.width, widgetSnap, windowId, windowState],
	);

	const handleResizeStop = useCallback(
		(
			_event: unknown,
			_direction: unknown,
			ref: HTMLElement,
			_delta: unknown,
			position: { x: number; y: number },
		) => {
			if (isMobile || windowState?.maximized || (!isWidget && !windowState?.resizable)) {return;}
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
			const manifestMin = AppRegistry.get(windowState.appId)?.minSize;
			const fitted = isWidget
				? fitRectToDesktop(
						viewport,
						{
							x: nextPosition.x,
							y: nextPosition.y,
							width: nextWidth,
							height: nextHeight,
						},
						{ width: manifestMin?.width ?? 80, height: manifestMin?.height ?? 48 },
					)
				: {
						x: nextPosition.x,
						y: nextPosition.y,
						width: nextWidth,
						height: nextHeight,
					};
			if (fitted.x !== nextPosition.x || fitted.y !== nextPosition.y) {
				rndRef.current?.updatePosition({ x: fitted.x, y: fitted.y });
			}
			if (fitted.width !== nextWidth || fitted.height !== nextHeight) {
				rndRef.current?.updateSize({ width: fitted.width, height: fitted.height });
			}
			updateWindow(windowId, fitted);
			emitWindowResize(windowId);
		},
		[clampDragPosition, isMobile, isWidget, updateWindow, viewport.height, viewport.width, windowId, windowState],
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

	const handleTitlebarDoubleClick = useCallback(
		(event: MouseEvent) => {
			if (positionFixed) {
				return;
			}
			const target = event.target as HTMLElement;
			if (target.closest(`.${XOS_WINDOW_NO_DRAG_CLASS}`)) {
				return;
			}
			handleMaximizeToggle(event);
		},
		[handleMaximizeToggle, positionFixed],
	);

	const handleClose = useCallback(
		(event: MouseEvent) => {
			event.stopPropagation();
			void getWindowApi(windowId)?.close();
		},
		[windowId],
	);

	const rndKey = windowState
		? `${windowState.contentKey}-${isMobile ? 'mob' : 'desk'}`
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

	const handleOpenWidgetSettings = useCallback(() => {
		const current = useWmStore.getState().windows[windowId];
		updateWindow(windowId, {
			widgetSettingsTick: (current?.widgetSettingsTick ?? 0) + 1,
		});
	}, [updateWindow, windowId]);

	if (!windowState) {return null;}

	const controlSize = isMobile ? 44 : 36;
	const canDrag = !isMaximizedLayout && !positionFixed;
	const canResize = !isMaximizedLayout && (isWidget || resizable);
	const manifestMin = AppRegistry.get(windowState.appId)?.minSize;
	const rndMinWidth = isWidget
		? (manifestMin?.width ?? 80)
		: isMobile
			? mobileBounds.width
			: (manifestMin?.width ?? minWidth);
	const rndMinHeight = isWidget
		? (manifestMin?.height ?? 48)
		: isMobile
			? mobileBounds.height
			: (manifestMin?.height ?? minHeight);

	return (
		<Rnd
			ref={rndRef}
			key={rndKey}
			default={defaultBounds}
			minWidth={rndMinWidth}
			minHeight={rndMinHeight}
			maxWidth={
				isWidget && viewport.width > 0
					? Math.max(rndMinWidth, viewport.width - Math.max(0, windowState.x))
					: undefined
			}
			maxHeight={
				isWidget && viewport.height > 0
					? Math.max(rndMinHeight, viewport.height - Math.max(0, windowState.y))
					: undefined
			}
			bounds={isWidget ? 'parent' : undefined}
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
				// Avoid sticky will-change on widgets — blocks paint until interaction.
				willChange: !isWidget && isDragging ? 'transform' : undefined,
			}}
			onDragStart={handleDragStart}
			onDrag={handleDrag}
			onResizeStart={handleFocus}
			onDragStop={handleDragStop}
			onResizeStop={handleResizeStop}
		>
			<Box
				ref={shellRef}
				className={isWidget ? `xos-widget-shell ${XOS_WINDOW_DRAG_HANDLE_CLASS}` : undefined}
				data-xos-window-id={windowId}
				data-xos-shell-role={windowState.shellRole ?? 'app'}
				style={{
					display: 'flex',
					flexDirection: 'column',
					height: '100%',
					position: 'relative',
					backgroundColor: isWidget ? 'transparent' : 'var(--xos-window-bg)',
					color: isWidget ? 'inherit' : 'var(--xos-window-text)',
					border: isWidget ? 'none' : '1px solid var(--xos-window-border)',
					borderRadius: 0,
					boxShadow: isWidget ? 'none' : 'var(--xos-window-shadow)',
					overflow: isWidget ? 'visible' : 'hidden',
					cursor: isWidget && canDrag ? 'grab' : undefined,
				}}
				onMouseDown={isWidget ? handleFocus : undefined}
				onMouseEnter={isWidget ? () => setWidgetControlsVisible(true) : undefined}
				onMouseLeave={isWidget ? () => setWidgetControlsVisible(false) : undefined}
			>
				{isWidget ? (
					<Group
						className={`xos-widget-controls ${XOS_WINDOW_NO_DRAG_CLASS}`}
						gap={2}
						wrap="nowrap"
						style={{
							position: 'absolute',
							top: 4,
							right: 4,
							zIndex: 2,
							opacity: widgetControlsVisible ? 1 : 0,
							transition: 'opacity 120ms ease',
							pointerEvents: widgetControlsVisible ? 'auto' : 'none',
						}}
					>
						<ActionIcon
							aria-label="Settings"
							className={XOS_WINDOW_NO_DRAG_CLASS}
							variant="filled"
							color="dark"
							size={22}
							radius="xl"
							onClick={handleOpenWidgetSettings}
						>
							⚙
						</ActionIcon>
						<ActionIcon
							aria-label="Close"
							className={XOS_WINDOW_NO_DRAG_CLASS}
							variant="filled"
							color="dark"
							size={22}
							radius="xl"
							onClick={handleClose}
						>
							×
						</ActionIcon>
					</Group>
				) : (
					<Group
						className={`${XOS_WINDOW_TITLEBAR_CLASS} ${XOS_WINDOW_DRAG_HANDLE_CLASS}`}
						gap={0}
						wrap="nowrap"
						justify="space-between"
						style={{
							flexShrink: 0,
							height: titlebarHeight,
							cursor: canDrag ? 'move' : 'default',
							background: 'var(--xos-window-titlebar-bg)',
							borderBottom: '1px solid var(--xos-window-titlebar-border)',
							color: 'var(--xos-window-text)',
							userSelect: 'none',
							paddingLeft: 12,
							paddingRight: 0,
						}}
						onMouseDown={handleFocus}
						onDoubleClick={handleTitlebarDoubleClick}
					>
						<Text
							size="sm"
							fw={500}
							truncate
							style={{ flex: 1, minWidth: 0 }}
							c="inherit"
							pr="xs"
						>
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
				)}

				<WindowSizeContext.Provider value={contentSizeValue}>
					<Box
						ref={contentRef}
						data-window-width={contentSizeValue.width}
						data-window-height={contentSizeValue.height}
						style={{
							position: 'relative',
							flex: autoSize ? '0 0 auto' : 1,
							minHeight: autoSize ? undefined : 0,
							overflow: autoSize || isWidget ? 'hidden' : 'auto',
							...(isWidget ? widgetSurfaceStyle : null),
							['--window-width' as string]: `${contentSizeValue.width}px`,
							['--window-height' as string]: `${contentSizeValue.height}px`,
						}}
					>
						<WindowContextMenu windowId={windowId} windowState={windowState}>
							<Box
								data-xos-window-content
								style={{
									minHeight: autoSize ? undefined : '100%',
									height: isWidget || !autoSize ? '100%' : undefined,
								}}
							>
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
