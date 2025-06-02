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
	useCallback,
	useEffect,
	useImperativeHandle,
	useMemo,
	useRef,
	useState,
} from 'react';
import { DraggableCore } from 'react-draggable';
import { wmStore } from '../../core/window-system';
import { getComputedSize } from '../../utils/domFns';
import { minMax } from '../../utils/fns';
import { isString } from '../../utils/is';
import './style.css';
import { WindowProvider } from './WindowContext';

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
		},
		ref,
	) {
		const uid = useId();
		const wm = wmStore();
		const [position, setPosition] = useState({
			left: x,
			top: y,
			width: w,
			height: h,
			zIndex: z,
		});
		const [{ isFullscreen, isCollapse, isActive }, updateState] = useSetState({
			isFullscreen: false,
			isCollapse: false,
			isActive: false,
		});

		// Обработчик полного экрана
		const handleFullscreen = useCallback(() => {
			if (!resizable) return;
			const newState = !isFullscreen;
			updateState({ isFullscreen: newState, isCollapse: false });
			onFullscreen?.(newState);
		}, [isFullscreen, resizable, onFullscreen]);

		// Обработчик свернуть экрана
		const handleCollapse = useCallback(() => {
			const newState = !isCollapse;
			updateState({
				isCollapse: newState,
				isActive: newState ? false : isActive,
			});
			if (newState) {
				wm?.disable?.();
			}
			onCollapse?.(newState);
		}, [isCollapse, isActive, onCollapse]);

		// Обработчик закрыть экрана
		const handleClose = useCallback(
			(event) => {
				onClose?.(event);
			},
			[onClose],
		);

		// Обработчик обновить
		const handleReload = useCallback(
			(event) => {
				onReload?.(event);
			},
			[onReload],
		);

		const win = useMemo(
			() => ({
				__: 'window',
				uid,
				wmGroup,
				wmSort,
				get isFullscreen() {
					return isFullscreen;
				},
				set isFullscreen(isFullscreen) {
					updateState({ isFullscreen });
				},
				get isCollapse() {
					return isCollapse;
				},
				set isCollapse(isCollapse) {
					updateState({ isCollapse });
				},

				get position() {
					return position;
				},
				set position(value) {
					setPosition((v) => ({
						...v,
						...(value || {}),
					}));
				},
				get w() {
					return position.width;
				},
				set w(val) {
					if (!val) {
						return;
					}
					setPosition((pos) => {
						if (isString(val) && val.substr(-1) === '%') {
							val = Math.ceil(
								(getComputedSize(parent)[0] * parseInt(val, 10)) / 100,
							);
						}
						pos.width = minMax(val, 0, 10000);
						if (aspectFactor) {
							pos.height = pos.width * aspectFactor;
						}
						return { ...pos };
					});
				},
				get h() {
					return position.height;
				},
				set h(val) {
					if (!val) {
						return;
					}
					setPosition((pos) => {
						if (isString(val) && val.substr(-1) === '%') {
							val = Math.ceil(
								(getComputedSize(parent)[1] * parseInt(val, 10)) / 100,
							);
						}
						pos.height = minMax(val, 0, 10000);
						if (aspectFactor) {
							pos.width = pos.height / aspectFactor;
						}
						return { ...pos };
					});
				},
				get x() {
					return position.left;
				},
				set x(val) {
					setPosition((pos) => {
						const [width] = getComputedSize(parent);
						if (val === 'center') {
							pos.left = (width - pos.width) / 2;
						} else if (val === 'right') {
							pos.left = width - pos.width;
						} else if (val === 'left') {
							pos.left = 0;
						} else if (isString(val) && val.substr(-1) === '%') {
							pos.left = Math.ceil((width * parseInt(val, 10)) / 100);
						} else {
							pos.left = val;
						}
						return { ...pos };
					});
				},
				get y() {
					return position.top;
				},
				set y(val) {
					setPosition((pos) => {
						const [, height] = getComputedSize(parent);
						if (val === 'center') {
							pos.top = (height - pos.height) / 2;
						} else if (val === 'bottom') {
							pos.top = height - pos.height;
						} else if (val === 'top') {
							pos.top = 0;
						} else if (isString(val) && val.substr(-1) === '%') {
							pos.top = Math.ceil((height * parseInt(val, 10)) / 100);
						} else {
							pos.top = val;
						}
						return { ...pos };
					});
				},
				get z() {
					return position.zIndex;
				},
				set z(zIndex) {
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

		useImperativeHandle(ref, () => win);

		// Обработчик перетаскивания окна
		const handleDrag = useCallback((e, { deltaX, deltaY }) => {
			setPosition((v) => ({
				...v,
				top: v.top + deltaY,
				left: v.left + deltaX,
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
			wm.add(win);
			if (!x && !y) {
				win.x = 'center';
				win.y = 'center';
			}
			return () => wm.del(win);
		}, []);

		return (
			<WindowProvider value={win}>
				<DraggableWrapper
					onDrag={handleDrag}
					disabled={!draggable || isFullscreen}
				>
					<div
						id={uid}
						className={classNames('x-window', className, {
							'x-window--draggable': draggable,
							'x-window--resizable':
								resizable && !isFullscreen && !isCollapse,
							'x-window--collapse': isCollapse,
							'x-window--fullscreen': isFullscreen,
							'x-window--active': isActive,
						})}
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
	onFullscreen?: (event: MouseEvent) => void;
	onCollapse?: (event: MouseEvent) => void;
	onClose?: (event: MouseEvent) => void;
	onReload?: (event: MouseEvent) => void;
}
const WindowIcons = memo(
	({
		icons,
		isFullscreen,
		onFullscreen = () => {},
		onCollapse = () => {},
		onClose = () => {},
		onReload = () => {},
		resizable,
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
	children: React.ReactNode;
}
const DraggableWrapper = memo(({ disabled, onDrag, children }: DraggableWrapperProps) => {
	const ref = useRef<null | HTMLElement>(null);
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
});
DraggableWrapper.propTypes = {
	disabled: PropTypes.bool,
	onDrag: PropTypes.func,
	children: PropTypes.node,
};
DraggableWrapper.defaultProps = {
	disabled: false,
	onDrag: () => {},
	children: null,
};
DraggableWrapper.displayName = './features/DraggableWrapper';
