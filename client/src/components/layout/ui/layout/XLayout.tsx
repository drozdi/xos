import classNames from 'classnames';
import React, { forwardRef, useImperativeHandle, useMemo } from 'react';
import { useElementResizeObserver } from '../../../../hooks/use-element-resize-observer';
import { useTemplateManager } from '../../context';
import './style.css';
import { XLayoutProvider } from './XLayoutContext';

interface XLayoutProps {
	children?: React.ReactNode;
	className?: string;
	container?: boolean;
	view?: string;
	onResize?: (width: number, height: number) => void;
}

export const XLayout = forwardRef(
	(
		{ children, className, container, view = 'hhh lpr fff', onResize }: XLayoutProps,
		ref,
	) => {
		const context = useTemplateManager();

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

		const ctx = useMemo(() => {
			return {
				container,
				rows,
				width,
				height,
			};
		}, [container, width, height, rows]);

		useImperativeHandle(ref, () => ctx);

		const { isHl, isHr, isFl, isFr } = useMemo(
			() => ({
				isHl: rows[0][0] === 'l' || !context?.hasTemplates?.('header'),
				isHr: rows[0][2] === 'r' || !context?.hasTemplates?.('header'),
				isFl: rows[2][0] === 'l' || !context?.hasTemplates?.('footer'),
				isFr: rows[2][2] === 'r' || !context?.hasTemplates?.('footer'),
			}),
			[rows],
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
	},
);
