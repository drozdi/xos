import { useDraggable } from '@dnd-kit/core';
import { ActionIcon, Group } from '@mantine/core';
import classNames from 'classnames';
import React, {
	cloneElement,
	forwardRef,
	memo,
	MouseEventHandler,
	useCallback,
	useEffect,
	useId,
	useImperativeHandle,
	useMemo,
	useRef,
} from 'react';
import { DraggableCore, DraggableEventHandler } from 'react-draggable';
import {
	TbMinus,
	TbReload,
	TbWindowMaximize,
	TbWindowMinimize,
	TbX,
} from 'react-icons/tb';
import { useApp } from '../../core/app-system';
import { setZIndex, useWmStore, zIndex } from '../../core/window-system';
import { getComputedSize } from '../../utils/domFns';
import { minMax } from '../../utils/fns';
import './style.css';
import { WindowProvider } from './WindowContext';

('use client');

interface IWindowProps {
	parent?: HTMLElement;
	aspectFactor?: number;
	className?: string;
	children: React.ReactNode;
	x?: number | string;
	y?: number | string;
	z?: number;
	w?: number | string;
	h?: number | string;
	title?: string;
	icons?: string;
	resizable?: boolean;
	draggable?: boolean;
	wmGroup?: string;
	wmSort?: number;
	tabIndex?: number;
	onFullscreen?: (fullscreen: boolean) => void;
	onCollapse?: (collapse: boolean) => void;
	onReload?: (event: React.MouseEvent) => void;
	onClose?: (event: React.MouseEvent) => void;
}
interface IWindowIconsProps {
	icons?: string;
	resizable?: boolean;
	isFullscreen?: boolean;
	onFullscreen?: MouseEventHandler;
	onCollapse?: MouseEventHandler;
	onClose?: MouseEventHandler;
	onReload?: MouseEventHandler;
}
interface IDraggableWrapperProps {
	disabled?: boolean;
	onDrag?: (e: any, data: any) => void;
	children: React.ReactElement;
	innerRef: React.RefObject<HTMLElement | null>;
}

interface PositionState {
	left?: number | string;
	top?: number | string;
	width?: number | string;
	height?: number | string;
	zIndex?: number;
}

interface StateState {
	isFullscreen: boolean;
	isCollapse: boolean;
	isActive: boolean;
}

const isBrowser = typeof window !== 'undefined';

export const Window = forwardRef(function WindowFn(
	{
		parent = document.body,
		aspectFactor,
		children,
		className,
		x = 'center',
		y = 'center',
		z,
		w = '50%',
		h = '50%',
		title,
		icons = 'close',
		//icons = "reload collapse fullscreen close",
		onFullscreen,
		onCollapse,
		onReload,
		onClose,
		resizable,
		draggable,
		wmGroup,
		wmSort = 0,
		tabIndex = -1,
	}: IWindowProps,
	ref: React.Ref<unknown>,
) {
	const uid = useId();
	const wm = useWmStore(
		useCallback(
			(state) => ({
				isActive: state.isActive,
				current: state.current,
				setZIndex: state.setZIndex,
				active: state.active,
				zIndex: state.zIndex,
				add: state.add,
				del: state.del,
				disable: state.disable,
			}),
			[],
		),
	);

	const $app = useApp();
	const $sm = $app?.sm('WINDOW');
	const positionRef = useRef<PositionState>({
		left: x,
		top: y,
		width: w,
		height: h,
		zIndex: z,
	});
	const [position, setPosition] = $sm.useState<PositionState>(
		'position',
		positionRef.current,
	);
	const updatePosition = useCallback(
		(pos: PositionState) =>
			setPosition(
				(prev: PositionState) =>
					(positionRef.current = {
						...prev,
						...pos,
					}),
			),
		[],
	);
	const updateZIndex = useCallback(
		(zIndex: number) => {
			setZIndex(zIndex);
			updatePosition({ zIndex });
		},
		[updatePosition],
	);
	const [{ isFullscreen, isCollapse, isActive }, updateState] =
		$sm.useSetState<StateState>('state', {
			isFullscreen: false,
			isCollapse: false,
			isActive: false,
		});
	const active = useMemo<boolean>(
		() => wm?.isActive({ uid }) ?? isActive,
		[wm.current, uid, isActive],
	);
	const innerRef = useRef<React.RefObject<HTMLElement> | null>(null);

	const emit = useCallback<any>(
		(...args: Record<string, any>[]) => $app?.emit(...args),
		[$app],
	);
	// Обработчик полного экрана
	const handleFullscreen = useCallback<MouseEventHandler>(
		(event: React.MouseEvent) => {
			if (!resizable) return;
			const newState = !isFullscreen;
			updateState({ isFullscreen: newState, isCollapse: false });
			onFullscreen?.(newState);
		},
		[isFullscreen, resizable, onFullscreen],
	);
	// Обработчик свернуть экрана
	const handleCollapse = useCallback<MouseEventHandler>(
		(event: React.MouseEvent) => {
			const newState = !isCollapse;
			updateState({
				isCollapse: newState,
				isActive: newState ? false : isActive,
			});
			if (newState) {
				wm?.disable();
			}
			onCollapse?.(newState);
		},
		[isCollapse, isActive, onCollapse],
	);
	// Обработчик закрыть экрана
	const handleClose = useCallback<MouseEventHandler>(
		(event: React.MouseEvent) => {
			emit('close', event);
			onClose?.(event);
		},
		[onClose, emit],
	);
	// Обработчик обновить
	const handleReload = useCallback<MouseEventHandler>(
		(event: React.MouseEvent) => {
			emit('reload', event);
			onReload?.(event);
		},
		[onReload, emit],
	);
	25;

	const handleActive = useCallback(
		(event: React.MouseEvent) => {
			if (active || isCollapse) return;
			updateZIndex(zIndex + 1);
			wm?.active({ uid });
			updateState({
				isActive: true,
				isCollapse: false,
			});
		},
		[isCollapse, active, uid, wm],
	);
	const handleDeActive = useCallback(
		(event: MouseEvent) => {
			if (!active) {
				return;
			}
			wm?.disable();
			updateState({ isActive: false });
		},
		[active, uid, updateState],
	);

	const focus = useCallback(
		(event: React.MouseEvent) =>
			$app ? emit('activated', event) : handleActive(event),
		[handleActive, emit, $app],
	);

	const calcDimensions = useCallback(
		(type: 'w' | 'h' | 'wh', val: number | string) => {
			if (typeof val === 'string' && val.endsWith('%') && parent) {
				const [pWidth, pHeight] = getComputedSize(parent);
				const percentage = parseInt(val, 10) / 100;
				val = type === 'w' ? pWidth * percentage : pHeight * percentage;
			}

			const pos: PositionState = {};
			if (type === 'w') {
				pos.width = minMax(val, 0, 10000) as number;
				if (aspectFactor) {
					pos.height = pos.width * aspectFactor;
				}
			} else if (type === 'h') {
				pos.width = minMax(val, 0, 10000) as number;
				if (aspectFactor) {
					pos.height = pos.width / aspectFactor;
				}
			}
			positionRef.current = {
				...positionRef.current,
				...pos,
			};
			return pos;
		},
		[parent, aspectFactor],
	);

	const calcPosition = useCallback(
		(axis: 'x' | 'y' | 'xy', val: number | string) => {
			const [pWidth, pHeight] = getComputedSize(parent);
			const { width, height } = positionRef.current;
			const pos: PositionState = {};
			if (axis === 'x') {
				if (val === 'center') {
					pos.left = (pWidth - width) / 2;
				} else if (val === 'right') {
					pos.left = pWidth - width;
				} else if (val === 'left') {
					pos.left = 0;
				} else if (typeof val === 'string' && val.endsWith('%')) {
					pos.left = Math.ceil((pWidth * parseInt(val, 10)) / 100);
				} else {
					pos.left = val;
				}
			} else if (axis === 'y') {
				if (val === 'center') {
					pos.top = (pHeight - height) / 2;
				} else if (val === 'bottom') {
					pos.top = pHeight - height;
				} else if (val === 'top') {
					pos.top = 0;
				} else if (typeof val === 'string' && val.endsWith('%')) {
					pos.top = Math.ceil((pHeight * parseInt(val, 10)) / 100);
				} else {
					pos.top = val;
				}
			}
			positionRef.current = {
				...positionRef.current,
				...pos,
			};
			return pos;
		},
		[parent],
	);

	const winAPI = useMemo(
		() => ({
			__: 'window',
			uid,
			wmGroup,
			wmSort,
			title,
			get isFullscreen(): boolean {
				return isFullscreen;
			},
			set isFullscreen(isFullscreen: boolean) {
				if (!resizable) return;
				updateState({ isFullscreen, isCollapse: false });
				onFullscreen?.(isFullscreen);
			},
			get isCollapse(): boolean {
				return isCollapse;
			},
			set isCollapse(isCollapse: boolean) {
				updateState({
					isCollapse: isCollapse,
					isActive: isCollapse ? false : isActive,
				});
				if (isCollapse) {
					wm?.disable?.();
				}
				onCollapse?.(isCollapse);
			},

			get position(): PositionState {
				return positionRef.current;
			},
			set position(value: PositionState) {
				updatePosition(value);
			},
			get w(): number | string | undefined {
				return positionRef.current.width;
			},
			set w(val: number | string) {
				updatePosition(calcDimensions('w', val));
			},
			get h(): number | string | undefined {
				return positionRef.current.height;
			},
			set h(val: number | string) {
				updatePosition(calcDimensions('h', val));
			},
			get x(): number | string | undefined {
				return positionRef.current.left;
			},
			set x(val: number | string) {
				updatePosition(calcPosition('x', val));
			},
			get y(): number | string | undefined {
				return positionRef.current.top;
			},
			set y(val: number | string) {
				updatePosition(calcPosition('y', val));
			},
			get z(): number | string | undefined {
				return positionRef.current.zIndex;
			},
			set z(zIndex: number | string) {
				updatePosition({
					zIndex: zIndex,
				});
			},
			focus,
			blur: handleDeActive,
		}),
		[
			uid,
			wmGroup,
			wmSort,
			title,
			isFullscreen,
			isCollapse,
			updateState,
			parent,
			aspectFactor,
			focus,
			handleDeActive,
		],
	);

	useImperativeHandle(ref, () => winAPI, [winAPI]);

	// Обработчик перетаскивания окна
	const handleDrag = useCallback<DraggableEventHandler>((e, { deltaX, deltaY }) => {
		if (isFullscreen || isCollapse) return;
		setPosition((prev: PositionState) => ({
			...prev,
			left: (prev.left as number) + deltaX,
			top: (prev.top as number) + deltaY,
		}));
	}, []);

	const style = useMemo(
		() =>
			isFullscreen || isCollapse
				? {
						zIndex: position.zIndex,
					}
				: position,
		[isFullscreen, isCollapse, position],
	);

	useEffect(() => {
		if (!isBrowser) {
			return;
		}

		const handleDocumentClick = (event: MouseEvent) => {
			if (!innerRef.current?.contains(event.target as HTMLElement)) {
				handleDeActive(event);
			}
		};

		document.documentElement.addEventListener('mousedown', handleDocumentClick);
		return () => {
			document.documentElement.removeEventListener(
				'mousedown',
				handleDocumentClick,
			);
		};
	}, [handleDeActive]);

	useEffect(() => {
		$sm.active = true;
		$app?.register(winAPI);
		$app?.on('activated', handleActive);
		$app?.on('deactivated', handleDeActive);
		wm?.add(winAPI);
		winAPI.z = Math.max(zIndex, position.zIndex ?? 0);
		$sm.first(() => {
			if (w) winAPI.w = w;
			if (h) winAPI.h = h;
			if (x) winAPI.x = x;
			if (y) winAPI.y = y;
		});
		return () => {
			wm?.disable?.();
			wm?.del?.(winAPI);
			$sm.remove();
			$app?.off('activated', handleActive);
			$app?.off('deactivated', handleDeActive);
			$app?.unRegister(winAPI);
		};
	}, []);
	const dnd = useDraggable({
		id: uid,
		disabled: draggable && !isFullscreen,
	});
	console.log(dnd);
	const { setActivatorNodeRef, setNodeRef, listeners, attributes } = dnd;
	return (
		<WindowProvider value={winAPI}>
			<div
				id={uid}
				className={classNames('x-window', className, {
					'x-window--draggable': draggable,
					'x-window--resizable': resizable && !isFullscreen && !isCollapse,
					'x-window--collapse': isCollapse,
					'x-window--fullscreen': isFullscreen,
					'x-window--active': active,
				})}
				onMouseDownCapture={focus}
				// onClick={focus}
				style={style}
				{...listeners}
				{...attributes}
				ref={setNodeRef}
			>
				<Group
					className="x-window-header"
					justify="between"
					ref={setActivatorNodeRef}
				>
					{title && <div className="x-window-title">{title}</div>}
					<WindowIcons
						icons={icons}
						resizable={resizable}
						isFullscreen={isFullscreen}
						onFullscreen={handleFullscreen}
						onCollapse={handleCollapse}
						onClose={handleClose}
						onReload={handleReload}
					/>
				</Group>

				<div className="x-window-content">{children}</div>
			</div>
		</WindowProvider>
	); //*/
});

const WindowIcons = memo(
	({
		icons = '',
		resizable,
		isFullscreen,
		onFullscreen = (event: React.MouseEvent) => {},
		onCollapse = (event: React.MouseEvent) => {},
		onClose = (event: React.MouseEvent) => {},
		onReload = (event: React.MouseEvent) => {},
	}: IWindowIconsProps) => {
		const props = {
			size: 'xs',
			radius: 0,
			variant: 'subtle',
			color: 'gray',
		};
		return (
			<Group
				className="x-window-icons x-window-drag-no"
				gap={1}
				style={{
					marginInlineStart: 'auto',
				}}
			>
				{icons.split(/\s+/).map((type) => {
					switch (type) {
						case 'close':
							return (
								<ActionIcon
									key={type}
									{...props}
									variant="filled"
									color="red"
									title="Закрыть"
									aria-label="Закрыть"
									onClick={onClose}
								>
									<TbX />
								</ActionIcon>
							);
						case 'reload':
							return (
								<ActionIcon
									key={type}
									{...props}
									title="Обновить"
									aria-label="Обновить"
									onClick={onReload}
								>
									<TbReload />
								</ActionIcon>
							);
						case 'fullscreen':
							return (
								resizable && (
									<ActionIcon
										key={type}
										{...props}
										onClick={onFullscreen}
										title={
											isFullscreen
												? 'Свернуть в окно'
												: 'Развернуть'
										}
										aria-label={
											isFullscreen
												? 'Свернуть в окно'
												: 'Развернуть'
										}
									>
										{isFullscreen ? (
											<TbWindowMinimize />
										) : (
											<TbWindowMaximize />
										)}
									</ActionIcon>
								)
							);
						case 'collapse':
							return (
								<ActionIcon
									key={type}
									{...props}
									onClick={onCollapse}
									title="Свернуть"
									aria-label="Свернуть"
								>
									<TbMinus />
								</ActionIcon>
							);
						default:
							return null;
					}
				})}
			</Group>
		);
	},
);

const DraggableWrapper = memo(
	({ disabled, onDrag, children, innerRef }: IDraggableWrapperProps) => {
		const ref = innerRef ?? useRef<React.RefObject<HTMLElement> | null>(null);
		return (
			<DraggableCore
				disabled={disabled}
				onDrag={onDrag}
				handle=".x-window-header"
				cancel=".x-window-drag-no"
				nodeRef={ref}
			>
				{cloneElement(children, { ref })}
			</DraggableCore>
		);
	},
);

Window.displayName = './features/Window';
WindowIcons.displayName = './features/WindowIcons';
DraggableWrapper.displayName = './features/DraggableWrapper';
