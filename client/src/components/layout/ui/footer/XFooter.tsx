import { useMergedRef } from '@mantine/hooks';
import classNames from 'classnames';
import React, { forwardRef, memo, useEffect, useRef } from 'react';
import { Sections } from '../../../ui/sections/Sections';
import { useXLayoutContext } from '../layout/XLayoutContext';
import './style.css';

interface XFooterProps {
	children?: React.ReactNode;
	className: string;
}

export const XFooter = memo(
	forwardRef(function XFooterFn({ children, className, ...props }: XFooterProps, ref) {
		const innerRef = useRef(null);
		const handleRef = useMergedRef(innerRef, ref);

		const ctx = useXLayoutContext();

		useEffect(() => {
			if (innerRef.current) {
				ctx.instances.footer = innerRef.current;
			}
			return () => {
				delete ctx.instances.footer;
			};
		}, [innerRef.current]);

		const isLayout = !!ctx;

		return (
			<Sections
				component="footer"
				{...props}
				className={classNames(
					'x-footer',
					{
						'x-layout-footer': isLayout,
					},
					className,
				)}
				ref={handleRef}
			>
				{children}
			</Sections>
		);
	}),
);
