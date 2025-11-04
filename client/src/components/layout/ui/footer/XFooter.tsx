import { useMergedRef } from '@mantine/hooks';
import classNames from 'classnames';
import React, { forwardRef, memo, useRef } from 'react';
import { Sections } from '../../../ui/sections/Sections';
import './style.css';

interface XFooterProps {
	children: React.ReactNode;
	className?: string;
}

export const XFooter = memo(
	forwardRef(function XFooterFn({ children, className, ...props }: XFooterProps, ref) {
		const innerRef = useRef(null);
		const handleRef = useMergedRef(innerRef, ref);
		if (!children) {
			return null;
		}
		return (
			<Sections
				component="footer"
				{...props}
				className={classNames('x-footer', className)}
				ref={handleRef}
			>
				{children}
			</Sections>
		);
	}),
);
