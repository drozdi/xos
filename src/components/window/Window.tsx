import { ActionIcon, Group } from '@mantine/core';
import { useId, useMove } from '@mantine/hooks';
import {
	IconMinus,
	IconReload,
	IconWindowMaximize,
	IconWindowMinimize,
	IconX,
} from '@tabler/icons-react';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import { forwardRef, memo, useImperativeHandle, useMemo, useRef, useState } from 'react';
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
		const [position, setPosition] = useState({ x, y });
		const { ref: containerRef, active } = useMove(setPosition);

		const contentRef = useRef<HTMLElement>(null);
		const win = useMemo(
			() => ({
				__: 'window',
				uid,
				wmGroup,
				wmSort,
			}),
			[uid, wmGroup, wmSort],
		);

		useImperativeHandle(ref, () => win);

		const style = useMemo(
			() => ({
				left: position.x,
				top: position.y,
			}),
			[position],
		);

		return (
			<WindowProvider value={win}>
				<div
					id={uid}
					className={classNames('x-window', className, {
						'x-window--resizable': resizable,
					})}
					ref={containerRef}
					style={style}
				>
					<Group className="x-window-header" justify="between">
						{title && <div className="x-window-title">{title}</div>}
						<WindowIcons icons={icons} resizable={resizable} />
					</Group>

					<div className="x-window-content" ref={contentRef}>
						{children}
					</div>
				</div>
			</WindowProvider>
		); //*/
	}),
);

interface WindowIconsProps {
	icons?: string;
	resizable?: boolean;
	isFullscreen?: boolean;
	onFullscreen?: () => void;
	onCollapse?: () => void;
	onClose?: () => void;
	onReload?: () => void;
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
WindowIcons.displayName = './features/WindowIcons';
WindowIcons.propTypes = {
	icons: PropTypes.string,
	resizable: PropTypes.bool,
	isFullscreen: PropTypes.bool,
	onFullscreen: PropTypes.func,
	onCollapse: PropTypes.func,
	onClose: PropTypes.func,
	onReload: PropTypes.func,
};
