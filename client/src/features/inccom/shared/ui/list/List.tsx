import { forwardRef, memo, type CSSProperties, type ReactNode } from 'react';

import { cls } from '../../utils';
import { ListProvider } from './ListContext';
import classes from './style.module.css';

const roleAttrExceptions = ['ul', 'ol'];

interface ListProps {
	component?: keyof HTMLElementTagNameMap;
	children?: ReactNode;
	className?: string;
	separator?: boolean;
	visible?: boolean;
	dense?: boolean;
	bordered?: boolean;
	striped?: boolean;
	role?: string;
	style?: CSSProperties;
	onClick?: () => void;
	onKeyDown?: () => void;
	onKeyUp?: () => void;
	onKeyPress?: () => void;
}

export const List = memo(
	forwardRef<HTMLElement, ListProps>(
		(
			{
				children,
				className,
				separator,
				dense,
				visible,
				bordered,
				striped,
				role,
				component = 'ul',
				...props
			},
			ref,
		) => {
			const Tag = component as 'ul';
			const attrRole = roleAttrExceptions.includes(component)
				? undefined
				: (role ?? 'list');
			return (
				<Tag
					{...props}
					ref={ref as React.Ref<HTMLUListElement>}
					className={cls(
						classes.list,
						{
							[classes.list_dense]: dense,
							[classes.list_visible]: visible,
							[classes.list_separator]: separator,
							[classes.list_bordered]: bordered,
							[classes.list_striped]: striped,
						},
						className,
					)}
					role={attrRole}
				>
					<ListProvider
						value={{
							dense,
						}}
					>
						{children}
					</ListProvider>
				</Tag>
			);
		},
	),
);
