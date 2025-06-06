import { ActionIcon, Group } from '@mantine/core';
import { useId, useSetState } from '@mantine/hooks';
import {
	IconMinus,
	IconReload,
	IconWindowMaximize,
	IconWindowMinimize,
	IconX,
} from '@tabler/icons-react';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import React, {
	cloneElement,
	forwardRef,
	memo,
	MouseEventHandler,
	useCallback,
	useEffect,
	useImperativeHandle,
	useMemo,
	useRef,
	useState,
} from 'react';
import { DraggableCore, DraggableEventHandler } from 'react-draggable';
import { wmStore } from '../../core/window-system';
import { getComputedSize } from '../../utils/domFns';
import { minMax } from '../../utils/fns';
import './style.css';
import { WindowProvider } from './WindowContext';

('use client');

interface WindowProps {
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

interface PositionState {
	left?: number | string;
	top?: number | string;
	width?: number | string;
	height?: number | string;
	zIndex?: number;
}

export const Window = memo(
	forwardRef(function WindowFn(
		{
			parent = document.body,
			aspectFactor,
			children,
			className,
			x = 20,
			y = 20,
			z,
			w,
			h,
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
		}: WindowProps,
		ref: React.Ref<unknown>,
	) {
		const uid = useId();
		const wm = wmStore();
		const [position, setPosition] = useState<PositionState>({
			left: x,
			top: y,
			width: w,
			height: h,
			zIndex: z,
		});
		const [{ isFullscreen, isCollapse, isActive }, updateState] = useSetState<{
			isFullscreen: boolean;
			isCollapse: boolean;
			isActive: boolean;
		}>({
			isFullscreen: false,
			isCollapse: false,
			isActive: false,
		});
		const active = useMemo<boolean>(
			() => wm.isActive?.({ uid }) ?? isActive,
			[wm.current, uid, isActive],
		);
		const innerRef = useRef<HTMLElement | null>(null);

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
					wm?.disable?.();
				}
				onCollapse?.(newState);
			},
			[isCollapse, isActive, onCollapse],
		);

		// Обработчик закрыть экрана
		const handleClose = useCallback<MouseEventHandler>(
			(event: React.MouseEvent) => {
				onClose?.(event);
			},
			[onClose],
		);

		// Обработчик обновить
		const handleReload = useCallback<MouseEventHandler>(
			(event: React.MouseEvent) => {
				onReload?.(event);
			},
			[onReload],
		);

		const handleActive = useCallback(
			(event: React.MouseEvent) => {
				if (!active) {
					wm.setZIndex?.(wm.zIndex + 1);
					wm.active?.({ uid });
					setPosition((v) => ({ ...v, zIndex: wm.zIndex }));
					updateState({ isActive: true, isCollapse: false });
				}
			},
			[updateState, setPosition, active, uid, wm],
		);
		const handleDeActive = useCallback(
			(event: MouseEvent) => {
				if (active && !innerRef.current?.contains(event?.target as HTMLElement)) {
					wm.disable();
				}
				updateState({ isActive: false });
			},
			[active, uid, updateState, title],
		);

		const win = useMemo(
			() => ({
				__: 'window',
				uid,
				wmGroup,
				wmSort,
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
					return position;
				},
				set position(value: PositionState) {
					setPosition((v) => ({
						...v,
						...(value || {}),
					}));
				},
				get w(): number | string | undefined {
					return position.width;
				},
				set w(val: number | string) {
					if (!val) {
						return;
					}
					setPosition((pos) => {
						if (typeof val === 'string' && val.substr(-1) === '%') {
							val = Math.ceil(
								(getComputedSize(parent)[0] * parseInt(val, 10)) / 100,
							);
						}
						pos.width = minMax(val, 0, 10000) as number;
						if (aspectFactor) {
							pos.height = pos.width * aspectFactor;
						}
						return { ...pos };
					});
				},
				get h(): number | string | undefined {
					return position.height;
				},
				set h(val: number | string) {
					if (!val) {
						return;
					}
					setPosition((pos) => {
						if (typeof val === 'string' && val.substr(-1) === '%') {
							val = Math.ceil(
								(getComputedSize(parent)[1] * parseInt(val, 10)) / 100,
							);
						}
						pos.height = minMax(val, 0, 10000) as number;
						if (aspectFactor) {
							pos.width = pos.height / aspectFactor;
						}
						return { ...pos };
					});
				},
				get x(): number | string | undefined {
					return position.left;
				},
				set x(val: number | string) {
					setPosition((pos) => {
						const [width] = getComputedSize(parent);
						const [_width] = getComputedSize(innerRef.current);
						if (val === 'center') {
							pos.left = (width - _width) / 2;
						} else if (val === 'right') {
							pos.left = width - _width;
						} else if (val === 'left') {
							pos.left = 0;
						} else if (typeof val === 'string' && val.substr(-1) === '%') {
							pos.left = Math.ceil((width * parseInt(val, 10)) / 100);
						} else {
							pos.left = val;
						}
						return { ...pos };
					});
				},
				get y(): number | string | undefined {
					return position.top;
				},
				set y(val: number | string) {
					setPosition((pos) => {
						const [, height] = getComputedSize(parent);
						const [, _height] = getComputedSize(innerRef.current);
						if (val === 'center') {
							pos.top = (height - _height) / 2;
						} else if (val === 'bottom') {
							pos.top = height - _height;
						} else if (val === 'top') {
							pos.top = 0;
						} else if (typeof val === 'string' && val.substr(-1) === '%') {
							pos.top = Math.ceil((height * parseInt(val, 10)) / 100);
						} else {
							pos.top = val;
						}
						return { ...pos };
					});
				},
				get z(): number | string | undefined {
					return position.zIndex;
				},
				set z(zIndex: number | string) {
					setPosition((v) => ({ ...v, zIndex: wm.zIndex }));
				},
			}),
			[
				uid,
				wmGroup,
				wmSort,
				position,
				isFullscreen,
				isCollapse,
				updateState,
				parent,
				aspectFactor,
			],
		);

		useImperativeHandle(ref, () => win, []);

		// Обработчик перетаскивания окна
		const handleDrag = useCallback<DraggableEventHandler>((e, { deltaX, deltaY }) => {
			setPosition((v) => ({
				...v,
				top: (v.top as number) + deltaY,
				left: (v.left as number) + deltaX,
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
			document.documentElement.addEventListener('mousedown', handleDeActive);
			return () => {
				document.documentElement.removeEventListener('mousedown', handleDeActive);
			};
		}, [handleDeActive]);

		useEffect(() => {
			wm?.add?.(win);
			if (!x && !y) {
				win.x = 'center';
				win.y = 'center';
			}
			return () => {
				wm?.disable?.();
				wm?.del?.(win);
			};
		}, []);

		return (
			<WindowProvider value={win}>
				<DraggableWrapper
					onDrag={handleDrag}
					disabled={!draggable || isFullscreen}
					innerRef={innerRef}
				>
					<div
						id={uid}
						className={classNames('x-window', className, {
							'x-window--draggable': draggable,
							'x-window--resizable':
								resizable && !isFullscreen && !isCollapse,
							'x-window--collapse': isCollapse,
							'x-window--fullscreen': isFullscreen,
							'x-window--active': active,
						})}
						onMouseDownCapture={handleActive}
						style={style}
					>
						<Group className="x-window-header" justify="between">
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
				</DraggableWrapper>
			</WindowProvider>
		); //*/
	}),
);

interface WindowIconsProps {
	icons?: string;
	resizable?: boolean;
	isFullscreen?: boolean;
	onFullscreen?: MouseEventHandler;
	onCollapse?: MouseEventHandler;
	onClose?: MouseEventHandler;
	onReload?: MouseEventHandler;
}

const WindowIcons = memo(
	({
		icons = '',
		resizable,
		isFullscreen,
		onFullscreen = (event: React.MouseEvent) => {},
		onCollapse = (event: React.MouseEvent) => {},
		onClose = (event: React.MouseEvent) => {},
		onReload = (event: React.MouseEvent) => {},
	}: WindowIconsProps) => {
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
									<IconX />
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
									<IconReload />
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
											<IconWindowMinimize />
										) : (
											<IconWindowMaximize />
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
									<IconMinus />
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
WindowIcons.propTypes = {
	icons: PropTypes.string,
	resizable: PropTypes.bool,
	isFullscreen: PropTypes.bool,
	onFullscreen: PropTypes.func,
	onCollapse: PropTypes.func,
	onClose: PropTypes.func,
	onReload: PropTypes.func,
};
WindowIcons.defaultProps = {
	icons: '',
	resizable: false,
	isFullscreen: false,
	onFullscreen: () => {},
	onCollapse: () => {},
	onClose: () => {},
	onReload: () => {},
};
WindowIcons.displayName = './features/WindowIcons';

interface DraggableWrapperProps {
	disabled?: boolean;
	onDrag?: (e: any, data: any) => void;
	children: React.ReactElement;
	innerRef: React.RefObject<HTMLElement | null>;
}
const DraggableWrapper = memo(
	({ disabled, onDrag, children, innerRef }: DraggableWrapperProps) => {
		const ref = innerRef ?? useRef<HTMLElement | null>(null);
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
DraggableWrapper.propTypes = {
	disabled: PropTypes.bool,
	onDrag: PropTypes.func,
	children: PropTypes.node,
	innerRef: PropTypes.RefObject,
};
DraggableWrapper.defaultProps = {
	disabled: false,
	onDrag: () => {},
	children: null,
	innerRef: {},
};
DraggableWrapper.displayName = './features/DraggableWrapper';
