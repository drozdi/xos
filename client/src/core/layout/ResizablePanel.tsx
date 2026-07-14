import { ActionIcon, Box, Burger } from '@mantine/core';
import { useCallback, useEffect, useRef, useState } from 'react';

import { HKEY_CONFIG_DEFAULTS } from '@/config/defaults';

import { useLayoutContext, type PanelSide } from './LayoutContext';

const COLLAPSE_THRESHOLD = 50;
const MIN_PANEL_WIDTH = 50;
const DEFAULT_PANEL_WIDTH = HKEY_CONFIG_DEFAULTS.layout.panels.left.width;
const HAMBURGER_STRIP_WIDTH = 40;

interface ResizablePanelProps {
	side: PanelSide;
	areaName: string;
	children?: React.ReactNode;
}

function getMaxPanelWidth(): number {
	return Math.floor(window.innerWidth * 0.4);
}

export function ResizablePanel({ side, areaName, children }: ResizablePanelProps) {
	const { leftWidth, rightWidth, setLeftWidth, setRightWidth } = useLayoutContext();
	const width = side === 'left' ? leftWidth : rightWidth;
	const setWidth = side === 'left' ? setLeftWidth : setRightWidth;

	const [collapsed, setCollapsed] = useState(width < COLLAPSE_THRESHOLD);
	const [overlayOpen, setOverlayOpen] = useState(false);
	const lastExpandedWidth = useRef(
		width >= COLLAPSE_THRESHOLD ? width : DEFAULT_PANEL_WIDTH,
	);
	const dragging = useRef(false);
	const dragStartX = useRef(0);
	const dragStartWidth = useRef(0);

	useEffect(() => {
		if (width >= COLLAPSE_THRESHOLD) {
			lastExpandedWidth.current = width;
			setCollapsed(false);
		} else {
			setCollapsed(true);
			setOverlayOpen(false);
		}
	}, [width]);

	const applyWidth = useCallback(
		(nextWidth: number) => {
			const maxWidth = getMaxPanelWidth();
			const clamped = Math.max(0, Math.min(nextWidth, maxWidth));

			if (clamped < COLLAPSE_THRESHOLD) {
				setCollapsed(true);
				setOverlayOpen(false);
				setWidth(0);
				return;
			}

			lastExpandedWidth.current = clamped;
			setCollapsed(false);
			setWidth(clamped);
		},
		[setWidth],
	);

	const handlePointerDown = useCallback(
		(event: React.PointerEvent<HTMLDivElement>) => {
			event.preventDefault();
			dragging.current = true;
			dragStartX.current = event.clientX;
			dragStartWidth.current = collapsed ? 0 : width;
			event.currentTarget.setPointerCapture(event.pointerId);
		},
		[collapsed, width],
	);

	const handlePointerMove = useCallback(
		(event: React.PointerEvent<HTMLDivElement>) => {
			if (!dragging.current) {return;}

			const delta = side === 'left'
				? event.clientX - dragStartX.current
				: dragStartX.current - event.clientX;
			applyWidth(dragStartWidth.current + delta);
		},
		[applyWidth, side],
	);

	const handlePointerUp = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
		dragging.current = false;
		event.currentTarget.releasePointerCapture(event.pointerId);
	}, []);

	const expandFromCollapsed = useCallback(() => {
		const restored = Math.max(lastExpandedWidth.current, MIN_PANEL_WIDTH);
		setCollapsed(false);
		setOverlayOpen(true);
		setWidth(restored);
	}, [setWidth]);

	const gridWidth = collapsed ? `${HAMBURGER_STRIP_WIDTH}px` : undefined;

	return (
		<>
			<Box
				style={{
					gridArea: areaName,
					position: 'relative',
					minHeight: 0,
					minWidth: 0,
					width: gridWidth,
					overflow: 'hidden',
					backgroundColor: collapsed ? 'transparent' : 'var(--mantine-color-dark-7)',
					borderRight: side === 'left' && !collapsed
						? '1px solid var(--mantine-color-dark-5)'
						: undefined,
					borderLeft: side === 'right' && !collapsed
						? '1px solid var(--mantine-color-dark-5)'
						: undefined,
				}}
			>
				{collapsed ? (
					<Box
						style={{
							display: 'flex',
							alignItems: 'flex-start',
							justifyContent: 'center',
							height: '100%',
							paddingTop: 8,
						}}
					>
						<ActionIcon
							variant="subtle"
							color="gray"
							aria-label={`Expand ${side} panel`}
							onClick={expandFromCollapsed}
						>
							<Burger size={16} opened={false} />
						</ActionIcon>
					</Box>
				) : (
					<>
						<Box
							style={{
								height: '100%',
								overflow: 'auto',
								padding: '0.5rem',
							}}
						>
							{children}
						</Box>
						<Box
							onPointerDown={handlePointerDown}
							onPointerMove={handlePointerMove}
							onPointerUp={handlePointerUp}
							onPointerCancel={handlePointerUp}
							style={{
								position: 'absolute',
								top: 0,
								bottom: 0,
								width: 6,
								cursor: 'col-resize',
								zIndex: 5,
								[side === 'left' ? 'right' : 'left']: -3,
							}}
						/>
					</>
				)}
			</Box>

			{collapsed && overlayOpen && (
				<Box
					style={{
						position: 'fixed',
						top: 0,
						bottom: 0,
						[side]: HAMBURGER_STRIP_WIDTH,
						width: Math.max(lastExpandedWidth.current, MIN_PANEL_WIDTH),
						zIndex: 900,
						backgroundColor: 'var(--mantine-color-dark-7)',
						borderRight: side === 'left'
							? '1px solid var(--mantine-color-dark-5)'
							: undefined,
						borderLeft: side === 'right'
							? '1px solid var(--mantine-color-dark-5)'
							: undefined,
						boxShadow: '0 0 24px rgba(0, 0, 0, 0.45)',
					}}
				>
					<Box
						style={{
							display: 'flex',
							justifyContent: side === 'left' ? 'flex-end' : 'flex-start',
							padding: 8,
						}}
					>
						<ActionIcon
							variant="subtle"
							color="gray"
							aria-label={`Collapse ${side} panel`}
							onClick={() => {
								setOverlayOpen(false);
								setCollapsed(true);
								setWidth(0);
							}}
						>
							<Burger size={16} opened />
						</ActionIcon>
					</Box>
					<Box style={{ height: 'calc(100% - 48px)', overflow: 'auto', padding: '0.5rem' }}>
						{children}
					</Box>
				</Box>
			)}
		</>
	);
}
