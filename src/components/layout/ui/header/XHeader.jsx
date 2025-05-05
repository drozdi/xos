import { useMergedRef } from '@mantine/hooks';
import classNames from 'classnames';
import { forwardRef, memo, useEffect, useRef } from 'react';
import { useXLayoutContext } from '../layout/XLayoutContext';
import './style.css';

export const XHeader = memo(
	forwardRef(function XHeaderFn({ children, className, ...props }, ref) {
		const innerRef = useRef(null);
		const handleRef = useMergedRef(innerRef, ref);

		const ctx = useXLayoutContext();

		useEffect(() => {
			if (innerRef.current) {
				ctx.instances.header = innerRef.current;
			}
			return () => {
				delete ctx.instances.header;
			};
		}, [innerRef.current]);

		const isLayout = !!ctx;

		return (
			<header
				{...props}
				className={classNames(
					'x-header',
					{
						'x-layout-header': isLayout,
					},
					className,
				)}
				ref={handleRef}
			>
				{children}
			</header>
		);
		/*return (
			<Sections
				as="header"
				square
				{...props}
				className={classNames(
					"x-header",
					{
						"x-layout-header": isLayout,
					},
					className
				)}
				ref={handleRef}
			>
				{children}
			</Sections>
		);*/
	}),
);
