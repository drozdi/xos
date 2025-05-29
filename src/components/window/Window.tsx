import { useId } from '@mantine/hooks';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import { cloneElement, memo, useImperativeHandle, useMemo, useRef } from 'react';
import './style.css';
import { WindowProvider } from './WindowContext';

export const Window = memo(
	forwardRefWithAs(function WindowFn(
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
					<Box
						className="xWindow-bar"
						justify="between"
						onDoubleClick={handleFullscreen}
					>
						{title && (
							<Box.Section side className="xWindow-title">
								{title}
							</Box.Section>
						)}
						<WindowIcons
							icons={icons}
							isFullscreen={isFullscreen}
							onFullscreen={handleFullscreen}
							onCollapse={handleCollapse}
							onClose={handleClose}
							onReload={handleReload}
							resizable={resizable}
						/>
					</Box>

					<div className="xWindow-content" ref={contentRef}>
						{children}
					</div>
				</div>
			</WindowProvider>
		); //*/
	}),
);

Window.propTypes = {
	parent: PropTypes.any,
	children: PropTypes.node,
	className: PropTypes.string,
	aspectFactor: PropTypes.number,
	x: PropTypes.number,
	y: PropTypes.number,
	z: PropTypes.number,
	w: PropTypes.number,
	h: PropTypes.number,
	title: PropTypes.string,
	icons: PropTypes.string,
	onFullscreen: PropTypes.func,
	onCollapse: PropTypes.func,
	onReload: PropTypes.func,
	onClose: PropTypes.func,
	resizable: PropTypes.bool,
	draggable: PropTypes.bool,
	wmGroup: PropTypes.string,
	wmSort: PropTypes.number,
};

const WindowIcons = memo(
	({
		icons,
		isFullscreen,
		onFullscreen = () => {},
		onCollapse = () => {},
		onClose = () => {},
		onReload = () => {},
		resizable,
	}) => (
		<Box.Section
			top
			side
			row
			noPadding
			as={XBtn.Group}
			className="xWindow-drag-no"
			color="dark"
			size="sm"
			flat
			square
		>
			{icons.split(/\s+/).map((type) => {
				switch (type) {
					case 'close':
						return (
							<XBtn
								key={type}
								className="bg-red-700/60"
								leftSection="mdi-close"
								title="Закрыть"
								onClick={onClose}
							/>
						);
					case 'reload':
						return (
							<XBtn
								key={type}
								leftSection="mdi-reload"
								title="Обновить"
								onClick={onReload}
							/>
						);
					case 'fullscreen':
						return (
							resizable && (
								<XBtn
									key={type}
									onClick={onFullscreen}
									leftSection={
										isFullscreen
											? 'mdi-fullscreen-exit'
											: 'mdi-fullscreen'
									}
									title={
										isFullscreen ? 'Свернуть в окно' : 'Развернуть'
									}
								/>
							)
						);
					case 'collapse':
						return (
							<XBtn
								key={type}
								onClick={onCollapse}
								leftSection="mdi-window-minimize"
								title="Свернуть"
							/>
						);
					default:
						return null;
				}
			})}
		</Box.Section>
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

// думать
const ResizableWrapper = memo(({ width, height, onResize, disabled, children }) => (
	<Resizable
		width={width}
		height={height}
		onResize={onResize}
		draggableOpts={{ disabled }}
		resizeHandles={!disabled ? ['s', 'w', 'e', 'n', 'sw', 'nw', 'se', 'ne'] : []}
		handle={(axis, ref) => (
			<div className={`xWindow-res xWindow-res--${axis}`} ref={ref} />
		)}
	>
		{children}
	</Resizable>
));
ResizableWrapper.displayName = './features/ResizableWrapper';
ResizableWrapper.propTypes = {
	width: PropTypes.number,
	height: PropTypes.number,
	onResize: PropTypes.func,
	disabled: PropTypes.bool,
	children: PropTypes.node,
};

const DraggableWrapper = memo(({ disabled, onDrag, children }) => {
	const ref = useRef();
	return (
		<DraggableCore
			disabled={disabled}
			onDrag={onDrag}
			handle=".xWindow-bar"
			cancel=".xWindow-res, .xWindow-drag-no"
			nodeRef={ref}
		>
			{cloneElement(children, { ref })}
		</DraggableCore>
	);
});

DraggableWrapper.displayName = './features/DraggableWrapper';
DraggableWrapper.propTypes = {
	disabled: PropTypes.bool,
	onDrag: PropTypes.func,
	children: PropTypes.node,
	nodeRef: PropTypes.any,
};
