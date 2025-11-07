import classNames from 'classnames';
import { useCallback, useMemo, useState } from 'react';
import { useElementResizeObserver } from '../../../../hooks/use-element-resize-observer';
import './style.css';
import { XLayoutProvider } from './XLayoutContext';

interface XLayoutProps {
	children?: React.ReactNode;
	className?: string;
	container?: boolean;
	view?: string;
	onResize?: (width: number, height: number) => void;
}

export const XLayout = ({
	children,
	className,
	container,
	view = 'hhh lpr fff',
	onResize,
}: XLayoutProps) => {
	const {
		ref: containerRef,
		width,
		height,
	} = useElementResizeObserver({
		onResize,
	});
	const rows = useMemo(
		() =>
			view
				.toLowerCase()
				.split(' ')
				.map((row) => {
					return row.split('');
				}),
		[view],
	);

	const [instances, setInstances] = useState({
		header: false,
		footer: false,
		left: false,
		right: false,
	});
	const joinInstance = useCallback(
		(instance: 'header' | 'footer' | 'left' | 'right', val: boolean) => {
			setInstances((prev) => ({ ...prev, [instance]: val }));
		},
		[],
	);

	const ctx = useMemo(() => {
		return {
			instances,
			joinInstance,
			container,
			rows,
			width,
			height,
		};
	}, [container, instances, width, height, rows]);

	const { isHl, isHr, isFl, isFr } = useMemo(
		() => ({
			isHl: rows[0][0] === 'l' || !instances.header,
			isHr: rows[0][2] === 'r' || !instances.header,
			isFl: rows[2][0] === 'l' || !instances.footer,
			isFr: rows[2][2] === 'r' || !instances.footer,
		}),
		[rows, instances],
	);

	const classes = useMemo(
		() => ({
			'x-layout--hl': isHl,
			'x-layout--hr': isHr,
			'x-layout--fl': isFl,
			'x-layout--fr': isFr,
		}),
		[isHl, isHr, isFl, isFr],
	);

	let layout = (
		<div className={classNames('x-layout', classes, className)}>{children}</div>
	);
	if (container) {
		layout = (
			<div className="x-layout-container" ref={containerRef}>
				{layout}
			</div>
		);
	}

	return <XLayoutProvider value={ctx}>{layout}</XLayoutProvider>;
};
