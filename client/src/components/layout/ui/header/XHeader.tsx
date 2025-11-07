import classNames from 'classnames';
import { useEffect } from 'react';
import { Sections } from '../../../ui/sections/Sections';
import { useXLayoutContext } from '../layout';
import './style.css';

interface XHeaderProps {
	children: React.ReactNode;
	className?: string;
}

export function XHeader({ children, className, ...props }: XHeaderProps) {
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
			component="header"
			{...props}
			className={classNames('x-header', className)}
		>
			{children}
		</Sections>
	);
}
