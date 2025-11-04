import { useMergedRef } from '@mantine/hooks';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import { forwardRef, memo, useRef } from 'react';
import './style.css';

interface XMainProps {
	className?: string;
	children?: React.ReactNode;
}

export const XMain = memo(
	forwardRef(function XMainFn({ children, className, ...props }: XMainProps, ref) {
		const innerRef = useRef(null);
		const handleRef = useMergedRef(innerRef, ref);

		if (!children) {
			return null;
		}
		return (
			<main
				{...props}
				ref={handleRef}
				className={classNames('x-main x-main-content', className)}
			>
				<div className="x-layout-content">{children}</div>
			</main>
		);
		/*return (
			<Box
				as="section"
				square
				noPadding
				className={classNames('x-main', { 'x-layout-main': isLayout })}
				ref={handleRef}
			>
				<main
					{...props}
					className={classNames(
						'x-main-content',
						{
							'x-layout-content': isLayout,
						},
						className,
					)}
				>
					{children}
				</main>
			</Box>
		);*/
	}),
);

XMain.propTypes = {
	children: PropTypes.node,
	className: PropTypes.string,
};
