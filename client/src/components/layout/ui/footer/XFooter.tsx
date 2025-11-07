import classNames from 'classnames';
import React, { useEffect } from 'react';
import { Sections } from '../../../ui/sections/Sections';
import { useXLayoutContext } from '../layout';
import './style.css';

interface XFooterProps {
	children: React.ReactNode;
	className?: string;
}

export function XFooter({ children, className, ...props }: XFooterProps) {
	if (!children) {
		return null;
	}
	const ctx = useXLayoutContext();
	useEffect(() => {
		ctx?.joinInstance?.('footer', true);
		return () => ctx?.joinInstance?.('footer', false);
	}, []);
	return (
		<Sections
			component="footer"
			{...props}
			className={classNames('x-footer', className)}
		>
			{children}
		</Sections>
	);
}
