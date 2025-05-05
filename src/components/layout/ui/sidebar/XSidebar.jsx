import { useMergedRef, useSetState } from '@mantine/hooks';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import { forwardRef, memo, useCallback, useEffect, useMemo, useRef } from 'react';
import { DraggableCore } from 'react-draggable';
import { useBreakpoint } from '../../../../hooks/use-breakpoint';
import { isUndefined } from '../../../../utils/is';
import { useXLayoutContext } from '../layout';
import './style.css';
import { XSidebarProvider } from './XSidebarContext';

function XBtn() {
	return null;
}

function XIcon() {
	return null;
}

/**
 * XSidebar sidebar component
 * @component Sidebar component for the sidebar component of the XSidebar component. This component is used to render the sidebar component of the XSidebar component.
 * @example <XSidebar>...</XSidebar>
 * @param {Object} props
 * @param {React.ReactNode} props.children children to render inside the sidebar
 * @param {string} [props.className] className to add to the component
 * @param {string} [props.type] type of the sidebar
 * @param {number} [props.breakpoint] breakpoint for the sidebar
 * @param {boolean} [props.mini] whether the sidebar is mini
 * @param {boolean} [props.miniOverlay] whether the mini sidebar overlay is shown
 * @param {boolean} [props.miniToggle] whether the mini sidebar toggle is shown when the sidebar is mini and the sidebar is open (only applies when the sidebar is mini)
 * @param {boolean} [props.miniMouse] whether the mini sidebar toggle is shown when the sidebar is mini and the sidebar is open (only applies when the sidebar is mini) and the sidebar is open (only applies when the sidebar is mini)
 * @param {boolean} [props.open] whether the sidebar is open (only applies when the sidebar is mini)
 * @param {boolean} [props.overlay] whether the sidebar overlay is shown (only applies when the sidebar is mini)
 * @param {boolean} [props.toggle] whether the sidebar toggle is shown (only applies when the sidebar is mini) and the sidebar is open (only applies when the sidebar is mini)
 * @param {boolean} [props.resizeable] whether the sidebar can be resized (only applies when the sidebar is mini)
 * @param {number} [props.w] width of the sidebar (only applies when the sidebar is mini)
 * @param {number} [props.miniW] width of the mini sidebar (only applies when the sidebar is mini)
 * @param {function} [props.onResize] function to call when the sidebar is resized (only applies when the sidebar is mini)
 * @param {function} [props.onMini] function to call when the mini sidebar is resized (only applies when the sidebar is mini)
 * @param {function} [props.onToggle] function to call when the sidebar is toggled (only applies when the sidebar is mini)
 * @param {function} [props.onOpen] function to call when the sidebar is opened (only applies when the sidebar is mini)
 * @param {function} [props.onClose] function to call when the sidebar is closed (only applies when the sidebar is mini)
 * @param {function} [props.onMiniOpen] function to call when the mini sidebar is opened (only applies when the sidebar is mini)
 * @param {function} [props.onMiniClose] function to call when the mini sidebar is closed (only applies when the sidebar is mini)
 * @param {React.Ref<HTMLDivElement>} ref ref to the component
 */

export const XSidebar = memo(
	forwardRef(function XSidebarFn(
		{
			children,
			className,

			type,
			breakpoint,
			mini,
			miniOverlay,
			miniToggle,
			miniMouse,

			open,
			overlay,
			toggle,

			resizeable,
			w,
			miniW,

			onResize,
			onMini,
			onToggle = () => true,
			...props
		},
		ref,
	) {
		const innerRef = useRef();
		const handleRef = useMergedRef(innerRef, ref);
		const ctx = useXLayoutContext();

		const isLayout = !!ctx;
		const isLeftSidebar = type === 'left';

		const [
			{ isMounted, width, miniWidth, innerMini, isOpenBreakpoint },
			updateState,
		] = useSetState({
			width: w,
			miniWidth: miniW,
			isOpenBreakpoint: false,
			isMounted: false,
			innerMini: mini,
		});

		const reverse = useMemo(() => type === 'right', [type]);

		const belowBreakpoint = useBreakpoint(breakpoint, ctx?.width || 1000);

		const { isEvents, isMouseEvent, isOpen, isOverlay } = useMemo(
			() => ({
				isEvents: !belowBreakpoint && (miniMouse || miniToggle),
				isMouseEvent: !belowBreakpoint && miniMouse && !miniToggle,
				isOpen: belowBreakpoint ? isOpenBreakpoint : open,
				isOverlay: overlay || (belowBreakpoint && miniOverlay),
			}),
			[
				belowBreakpoint,
				miniMouse,
				miniToggle,
				isOpenBreakpoint,
				open,
				overlay,
				miniOverlay,
			],
		);

		const { isMiniOverlay, isMini } = useMemo(
			() => ({
				isMiniOverlay:
					(miniOverlay || ((isEvents || mini) && overlay)) && !belowBreakpoint,
				isMini: isEvents ? innerMini : mini && !belowBreakpoint,
			}),
			[miniOverlay, isEvents, innerMini, overlay, mini, belowBreakpoint],
		);

		const canResized = useMemo(
			() => resizeable && !isEvents && !isMini && !belowBreakpoint,
			[resizeable, isEvents, isMini, belowBreakpoint],
		);

		const containerStyle = useMemo(
			() => ({
				width:
					!isOpen || isOverlay
						? ''
						: isMiniOverlay || isMini
							? miniWidth
							: isOverlay
								? 0
								: width,
			}),
			[width, isOpen, isMini, isOverlay, miniWidth, isMiniOverlay],
		);

		const style = useMemo(
			() => ({
				width: isOpen
					? isMini
						? miniWidth
						: belowBreakpoint
							? w || ''
							: width
					: 0,
			}),
			[width, isOpen, isMini, belowBreakpoint, w],
		);

		useEffect(() => {
			if (innerRef.current) {
				if (!isUndefined(window)) {
					const style = window.getComputedStyle(innerRef.current);
					const w = parseInt(style.width || 0, 10) || 0;
					const minWidth = parseInt(style.minWidth || 0, 10) || 0;
					//width ?? updateState({width: w});
					miniWidth ?? updateState({ miniWidth: minWidth });
				}
			}
		}, [innerRef]);

		useEffect(
			() =>
				updateState({
					isOpenBreakpoint: !isOpenBreakpoint,
				}),
			[open],
		);

		useEffect(
			() =>
				updateState({
					isOpenBreakpoint: false,
				}),
			[belowBreakpoint],
		);

		useEffect(() => {
			const handleClose = ({ target }) => {
				if (target.closest('.x-sidebar') !== innerRef.current) {
					updateState({
						innerMini: true,
						isOpenBreakpoint: false,
					});
				}
			};
			if (miniMouse && (miniToggle || belowBreakpoint)) {
				document.addEventListener('click', handleClose);
			}
			return () => {
				document.removeEventListener('click', handleClose);
			};
		}, [miniMouse, miniToggle, belowBreakpoint, innerRef.current]);

		useEffect(() => onMini?.(isMini), [isMini]);

		const onHandleDrag = useCallback(
			(e, ui) => {
				updateState({
					width: Math.max(miniWidth, w + (reverse ? -ui.deltaX : ui.deltaX)),
				});
			},
			[reverse, miniWidth],
		);

		const onHandleDragEnd = useCallback(
			(e, ui) => {
				const width = Math.max(
					innerRef.current?.getBoundingClientRect().width,
					miniWidth,
				);
				updateState({ width });
				onResize?.(width);
			},
			[innerRef.current, miniWidth],
		);

		const onHandleToggle = useCallback(() => {
			if (
				false ===
				onToggle?.({
					width,
					isOpen,
					isMini,
				})
			) {
				return;
			}
			updateState({
				isOpenBreakpoint: !isOpenBreakpoint,
			});
		}, [width, isOpen, isMini]);

		const onHandleMiniToggle = useCallback(() => {
			if (
				false ===
				onToggle?.({
					width,
					isOpen,
					isMini,
				})
			) {
				return;
			}
			updateState({ innerMini: !innerMini });
		}, [width, isOpen, isMini]);

		useEffect(() => {
			updateState({ isMounted: true });
			if (ctx && innerRef.current) {
				ctx.instances[type] = innerRef.current;
			}
			return () => {
				if (ctx) {
					delete ctx.instances[type];
				}
			};
		}, []);

		return (
			<div
				className={classNames('x-sidebar-container', {
					'x-layout-sidebar': isLayout,
					[`x-layout-sidebar--${type}`]: isLayout && type,
					'x-sidebar--animate': !canResized,
				})}
				style={containerStyle}
				onMouseEnter={() => isMouseEvent && updateState({ innerMini: false })}
				onMouseLeave={() => isMouseEvent && updateState({ innerMini: true })}
			>
				<XSidebarProvider value={{ width, isMini, isOpen }}>
					<div
						className={classNames('x-sidebar', {
							'is-mounted': isMounted,
							'x-layout-sidebar': isLayout,
							[`x-layout-sidebar--${type}`]: isLayout && type,
							[`x-sidebar--${type}`]: type,
							'x-sidebar--toggle': miniToggle,
							'x-sidebar--mini': isMini,
							'x-sidebar--close': !isOpen,
							'x-sidebar--animate': !canResized,
							'x-sidebar--overlay': isOverlay,
							'x-sidebar--mini-overlay': isMiniOverlay,
						})}
						style={style}
						ref={handleRef}
					>
						{toggle && belowBreakpoint && (
							<div className="x-sidebar-toggle">
								<XBtn
									color="accent"
									size="xs"
									rightSection={
										<XIcon className="text-2xl">
											{isOpen
												? `mdi-menu-${type}`
												: `mdi-menu-${
														isLeftSidebar ? 'right' : 'left'
													}`}
										</XIcon>
									}
									onClick={onHandleToggle}
									title={isOpen ? 'Свернуть' : 'Развернуть'}
								/>
							</div>
						)}
						<div className={classNames('x-sidebar-content', className)}>
							{children}
						</div>
						{miniToggle && !belowBreakpoint && (
							<div className="x-sidebar-toggle-mini">
								<XBtn
									dimmed
									plain
									block
									square
									leftSection={
										isMini
											? `mdi-arrow-${
													isLeftSidebar ? 'right' : 'left'
												}-bold-box-outline`
											: `mdi-arrow-${type}-bold-box-outline`
									}
									onClick={onHandleMiniToggle}
									className="text-2xl py-0"
									title={isMini ? 'Развернуть' : 'Свернуть'}
								/>
							</div>
						)}

						{canResized && (
							<DraggableCore onDrag={onHandleDrag} onStop={onHandleDragEnd}>
								<div className="x-sidebar-res"></div>
							</DraggableCore>
						)}
					</div>
				</XSidebarProvider>
			</div>
		);
	}),
);

XSidebar.propTypes = {
	children: PropTypes.any,
	className: PropTypes.string,
	type: PropTypes.oneOf(['left', 'right']),

	open: PropTypes.bool,
	w: PropTypes.number,
	overlay: PropTypes.bool,
	toggle: PropTypes.bool,

	breakpoint: PropTypes.number,

	mini: PropTypes.bool,
	miniW: PropTypes.number,
	miniMouse: PropTypes.bool,
	miniToggle: PropTypes.bool,
	miniOverlay: PropTypes.bool,

	resizeable: PropTypes.bool,

	onMini: PropTypes.func,
	onToggle: PropTypes.func,
	onResize: PropTypes.func,
};
