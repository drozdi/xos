import { Box, Portal, ScrollArea } from '@mantine/core';
import { useMounted, useSetState } from '@mantine/hooks';
import classNames from 'classnames';
import {
	forwardRef,
	memo,
	useCallback,
	useEffect,
	useImperativeHandle,
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
import { XSidebarToggleBtn } from './XSidebarToggleBtn';

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
		const layout = useXLayoutContext();
		const isLayout = !!layout;

		const hasHeader = title || toggle;
		const hasFooter = miniToggle;

		const belowBreakpoint = useBreakpoint(breakpoint, layout?.width || 1000);
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

		const [{ width, miniWidth }, updateState] = useSetState({
			width: w,
			miniWidth: mw,
		});

		const [isOpenBreakpoint, setOpenBreakpoint] = useState(false);
		const [innerMini, setInnerMini] = useState(mini);

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
		/*useEffect(() => {
			if (innerRef.current && !isUndefined(window)) {
				const style = window.getComputedStyle(innerRef.current);
				const w = parseInt(style.width || 0, 10) || 0;
				const minWidth = parseInt(style.minWidth || 0, 10) || 0;
				//width ?? updateState({width: w});
				miniWidth ?? updateState({ miniWidth: minWidth });
			}
		}, []);

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
		}, [miniMouse, miniToggle, belowBreakpoint, innerRef.current]);*/

		const ctx = useMemo(() => {
			return {
				type,
				width,
				mini: isMini,
				open: isOpen,
				getElement: () => innerRef.current,
			};
		}, [type, width, isMini, isOpen]);

		const onHandleToggle = useCallback(() => {
			if (false === onToggle?.(ctx)) {
				return;
			}
			setOpenBreakpoint((v) => !v);
		}, [onToggle, ctx]);

		const onHandleMiniToggle = useCallback(
			(event) => {
				event?.preventDefault();
				if (false === onToggle?.(ctx)) {
					return;
				}
				setInnerMini((v) => !v);
			},
			[onToggle, updateState, ctx],
		);

		useEffect(() => setOpenBreakpoint(false), [belowBreakpoint]);
		useEffect(() => setOpenBreakpoint((v) => !v), [open]);
		useEffect(() => setInnerMini(mini), [mini]);

		/*seEffect(() => {
			if (layout && ctx) {
				layout.instances[type] = ctx;
			}
			return () => {
				if (layout) {
					delete layout.instances[type];
				}
			};
		}, []);*/

		useImperativeHandle(ref, () => ctx, [ctx]);

		const [ss, setSs] = useState(true);

		return (
			<>
				<XSidebarProvider value={ctx}>
					<div
						className="x-sidebar-container"
						onMouseEnter={() => isMouseEvent && setInnerMini(false)}
						onMouseLeave={() => isMouseEvent && setInnerMini(true)}
					>
						<div
							className={classNames('x-sidebar', {
								[`x-sidebar--${type}`]: type,
								'x-sidebar--close': !isOpen,
								'x-sidebar--mini': isMini,
								'x-sidebar--overlay': isOverlay,
								'x-sidebar--mini-overlay': isMiniOverlay,
							})}
							ref={innerRef}
						>
							{toggle && belowBreakpoint && (
								<XSidebarToggleBtn onClick={onHandleToggle} />
							)}
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
							breakpoint: {breakpoint} - {layout?.width}
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
							isOpenBreakpoint: {isOpenBreakpoint ? 'true' : 'false'}
							<br />
						</Box>
					</Portal>
				)}
			</>
		);
	}),
);
