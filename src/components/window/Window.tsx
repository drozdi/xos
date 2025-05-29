import { ActionIcon, Box, Group } from '@mantine/core';
import { useId } from '@mantine/hooks';
import {
	IconMinus,
	IconReload,
	IconWindowMaximize,
	IconWindowMinimize,
	IconX,
} from '@tabler/icons-react';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import { forwardRef, memo, useImperativeHandle, useMemo, useRef } from 'react';
import './style.css';
import { WindowProvider } from './WindowContext';

export const Window = memo(
	forwardRef(function WindowFn(
		{
			parent = document.body,
			aspectFactor,
			children,
			className,
			x,
			y,
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

		return (
			<WindowProvider value={win}>
				<div id={uid} className={classNames('xWindow', className, {})}>
					<Box className="xWindow-bar" justify="between">
						<WindowIcons icons={icons} resizable={resizable} />
					</Box>

					<div className="xWindow-content" ref={contentRef}>
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
	}: WindowIconsProps) => (
		<Group
			className="xWindow-drag-no"
			gap={0}
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
									onClick={onFullscreen}
									title={
										isFullscreen ? 'Свернуть в окно' : 'Развернуть'
									}
									aria-label={
										isFullscreen ? 'Свернуть в окно' : 'Развернуть'
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
								onClick={onCollapse}
								key={type}
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
	),
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
