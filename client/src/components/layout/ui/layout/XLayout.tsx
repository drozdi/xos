import classNames from 'classnames';
import React, { forwardRef, useImperativeHandle, useMemo } from 'react';
import { useElementResizeObserver } from '../../../../hooks/use-element-resize-observer';
import { TemplateProvider, useTemplateContext } from '../../context';
import './style.css';
import { XLayoutProvider } from './XLayoutContext';

interface XLayoutProps {
	children?: React.ReactNode;
	className?: string;
	container?: boolean;
	view?: string;
	onResize?: (width: number, height: number) => void;
}

export const XLayout = forwardRef(function XLayoutFn(
	{ children, className, container, view = 'hhh lpr fff', onResize }: XLayoutProps,
	ref,
) {
	const context = useTemplateContext();
	const isTemplates = (slotName: string) => !!context.templates[slotName];

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
			isHl: rows[0][0] === 'l' || !isTemplates?.('header'),
			isHr: rows[0][2] === 'r' || !isTemplates?.('header'),
			isFl: rows[2][0] === 'l' || !isTemplates?.('footer'),
			isFr: rows[2][2] === 'r' || !isTemplates?.('footer'),
		}),
		[rows, context?.templates],
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

	return (
		<XLayoutProvider value={ctx}>
			<TemplateProvider value={context}>{layout}</TemplateProvider>
		</XLayoutProvider>
	);
});
