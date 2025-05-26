import { Box, Portal, ScrollArea } from '@mantine/core';
import { useMergedRef, useMounted, useSetState } from '@mantine/hooks';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import {
	forwardRef,
	memo,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from 'react';
import { useBreakpoint } from '../../../../hooks/use-breakpoint';
import { useXLayoutContext } from '../layout';
import './style.css';
import { XSidebarProvider } from './XSidebarContext';
import { XSidebarHeader } from './XSidebarHeader';
import { XSidebarMiniBtn } from './XSidebarMiniBtn';
import { XSidebarTitle } from './XSidebarTitle';

function XBtn() {
	return null;
}

function XIcon() {
	return null;
}

export const XSidebar = memo(
	forwardRef(function XSidebarFn(
		{
			children,
			className,
			title,
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
			w = 256,
			mw = 56,

			onBreakPoint,

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

		const hasHeader = title || toggle;

		const belowBreakpoint = useBreakpoint(breakpoint, ctx?.width || 1000);
		const isMounted = useMounted();

		/* my be ref */
		const breakPointFn = useCallback(
			(value) => {
				onBreakPoint?.(value);
			},
			[onBreakPoint],
		);
		useEffect(() => {
			breakPointFn(belowBreakpoint);
		}, [breakPointFn, belowBreakpoint]);

		const [{ width, miniWidth, isOpenBreakpoint, innerMini }, updateState] =
			useSetState({
				width: w,
				miniWidth: mw,
				innerMini: mini,
				isOpenBreakpoint: false,
			});

		const { isOpen, isOverlay, isEvents, isMouseEvent } = useMemo(
			() => ({
				isOpen: belowBreakpoint ? isOpenBreakpoint : open,
				isOverlay: overlay || (belowBreakpoint && miniOverlay),
				isEvents: !belowBreakpoint && (miniMouse || miniToggle),
				isMouseEvent: !belowBreakpoint && miniMouse && !miniToggle,
			}),
			[
				belowBreakpoint,
				isOpenBreakpoint,
				open,
				overlay,
				miniOverlay,
				miniMouse,
				miniToggle,
			],
		);

		const { isMiniOverlay, isMini } = useMemo(
			() => ({
				isMiniOverlay:
					(miniOverlay || ((isEvents || mini) && overlay)) && !belowBreakpoint,
				isMini: isEvents ? innerMini : mini && !belowBreakpoint,
			}),
			[miniOverlay, overlay, innerMini, mini, isEvents, belowBreakpoint],
		);

		/*const canResized = useMemo(
			() => resizeable && !isMini && !belowBreakpoint,
			[resizeable, isMini, belowBreakpoint],
		);*/

		const containerStyle = useMemo(
			() => ({
				/*width:
					!isOpen || isOverlay
						? ''
						: isMiniOverlay || isMini
							? miniWidth
							: isOverlay
								? 0
								: width,*/
			}),
			[width, isOpen, isMini, isOverlay, miniWidth, isMiniOverlay],
		);
		const style = useMemo(
			() => ({
				/*width: isOpen
					? isMini
						? miniWidth
						: belowBreakpoint
							? w || ''
							: width
					: 0,*/
			}),
			[width, isOpen, isMini, belowBreakpoint, w],
		);

		/*useEffect(() => {
			if (innerRef.current && !isUndefined(window)) {
				const style = window.getComputedStyle(innerRef.current);
				const w = parseInt(style.width || 0, 10) || 0;
				const minWidth = parseInt(style.minWidth || 0, 10) || 0;
				//width ?? updateState({width: w});
				miniWidth ?? updateState({ miniWidth: minWidth });
			}
		}, []);

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

		useEffect(() => onMini?.(isMini), [isMini]);*/

		/*const onHandleDrag = useCallback(
			(e, ui) => {
				updateState({
					width: Math.max(miniWidth, w + (reverse ? -ui.deltaX : ui.deltaX)),
				});
			},
			[reverse, miniWidth],
		);*/
		/*const onHandleDragEnd = useCallback(
			(e, ui) => {
				const width = Math.max(
					innerRef.current?.getBoundingClientRect().width,
					miniWidth,
				);
				updateState({ width });
				onResize?.(width);
			},
			[innerRef.current, miniWidth],
		);*/
		/*const onHandleToggle = useCallback(() => {
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
		}, [width, isOpen, isMini]);*/

		/*useEffect(() => {
			if (ctx && innerRef.current) {
				ctx.instances[type] = innerRef.current;
			}
			return () => {
				if (ctx) {
					delete ctx.instances[type];
				}
			};
		}, []);*/
		const [ss, setSs] = useState(true);

		const ctx_ = useMemo(() => {
			return { type, width, mini: isMini, open: isOpen };
		}, [type, width, isMini, isOpen]);

		const onHandleMiniToggle = useCallback(
			(event) => {
				event?.preventDefault();
				if (false === onToggle?.(ctx_)) {
					return;
				}
				updateState({ innerMini: !innerMini });
			},
			[innerMini, onToggle, updateState, ctx_],
		);

		return (
			<>
				<XSidebarProvider value={ctx_}>
					<div
						className="x-sidebar-container"
						style={containerStyle}
						onMouseEnter={() =>
							isMouseEvent && updateState({ innerMini: false })
						}
						onMouseLeave={() =>
							isMouseEvent && updateState({ innerMini: true })
						}
					>
						<div
							className={classNames('x-sidebar', {
								[`x-sidebar--${type}`]: type,
								'x-sidebar--mini': isMini,
								'x-sidebar--overlay': isOverlay,
								'x-sidebar--mini-overlay': isMiniOverlay,
							})}
							//style={style}
							ref={handleRef}
						>
							{hasHeader && (
								<XSidebarHeader>
									{title && <XSidebarTitle>{title}</XSidebarTitle>}
								</XSidebarHeader>
							)}
							<ScrollArea
								className={classNames('x-sidebar-content', className)}
							>
								{children}
							</ScrollArea>
							{miniToggle && !belowBreakpoint && (
								<XSidebarMiniBtn onClick={onHandleMiniToggle} />
							)}
						</div>
					</div>
				</XSidebarProvider>

				{true && (
					<Portal target="body">
						<Box
							pos="fixed"
							bg="rgba(0,0,0,0.5)"
							color="rgb(255,255,255)"
							top={64}
							right={0}
							w={ss ? '200' : 0}
							p={16}
							style={{
								zIndex: 1000,
							}}
						>
							fre:{' '}
							<input
								type="checkbox"
								checked={ss}
								onChange={() => setSs((v) => !v)}
							/>
							<br />
							breakpoint: {breakpoint} - {ctx?.width}
							<br />
							mini: {mini ? 'true' : 'false'}
							<br />
							miniOverlay: {miniOverlay ? 'true' : 'false'}
							<br />
							miniToggle: {miniToggle ? 'true' : 'false'}
							<br />
							miniMouse: {miniMouse ? 'true' : 'false'}
							<br />
							open: {open ? 'true' : 'false'}
							<br />
							overlay: {overlay ? 'true' : 'false'}
							<br />
							toggle: {toggle ? 'true' : 'false'}
							<br />
							<br />
							belowBreakpoint: {belowBreakpoint ? 'true' : 'false'}
							<br />
							isEvents: {isEvents ? 'true' : 'false'}
							<br />
							isMouseEvent: {isMouseEvent ? 'true' : 'false'}
							<br />
							innerMini: {innerMini ? 'true' : 'false'}
							<br />
							isMini: {isMini ? 'true' : 'false'}
							<br />
							isOverlay: {isOverlay ? 'true' : 'false'}
							<br />
							isMiniOverlay: {isMiniOverlay ? 'true' : 'false'}
							<br />
						</Box>
					</Portal>
				)}
			</>
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
