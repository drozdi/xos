import classNames from 'classnames';
import { forwardRef, useImperativeHandle, useMemo, useRef } from 'react';
import { useElementResizeObserver } from '../../../../hooks/use-element-resize-observer';
import { XLayoutProvider } from './XLayoutContext';
import './style.css';

export const XLayout = forwardRef(function XLayoutFn(
	{ children, className, container, view = 'hhh lpr fff', onResize },
	ref,
) {
	const {
		ref: containerRef,
		width,
		height,
	} = useElementResizeObserver({
		onResize,
	});
	const instances = useRef({});
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
			get instances() {
				return instances.current;
			},
			set instances(val) {
				instances.current = val;
			},
			container,
			rows,
			width,
			height,
		};
	}, [container, width, height, rows]);

	useImperativeHandle(ref, () => ctx);

	const { isHl, isHr, isFl, isFr } = useMemo(
		() => ({
			isHl: rows[0][0] === 'l' || !instances.current.header,
			isHr: rows[0][2] === 'r' || !instances.current.header,
			isFl: rows[2][0] === 'l' || !instances.current.footer,
			isFr: rows[2][2] === 'r' || !instances.current.footer,
		}),
		[rows, instances.current.header, instances.current.footer],
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
});
