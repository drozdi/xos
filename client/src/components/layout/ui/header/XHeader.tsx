import { useMergedRef } from '@mantine/hooks';
import classNames from 'classnames';
import { forwardRef, memo, useRef } from 'react';
import { Sections } from '../../../ui/sections/Sections';
import './style.css';

interface XHeaderProps {
	children: React.ReactNode;
	className?: string;
}

export const XHeader = memo(
	forwardRef(function XHeaderFn({ children, className, ...props }: XHeaderProps, ref) {
		const innerRef = useRef(null);
		const handleRef = useMergedRef(innerRef, ref);

		return (
			<Sections
				component="header"
				{...props}
				className={classNames('x-header', className)}
				ref={handleRef}
			>
				{children}
			</Sections>
		);
	}),
);
