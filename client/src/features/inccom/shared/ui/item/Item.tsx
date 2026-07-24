import { forwardRef, memo, useMemo, useRef, type ReactNode } from 'react';

import { cls } from '../../utils';
import { useListContext } from '../list/ListContext';
import classes from './style.module.css';

const clickableTag = ['a', 'label', 'button'];
const disRoleTag = ['label'];
const disDisabledTag = ['div', 'span', 'a', 'label'];

interface ItemProps {
	component?: string;
	children?: ReactNode;
	className?: string;
	role?: string;
	tabIndex?: number;
	vertical?: boolean;
	dense?: boolean;
	active?: boolean;
	activeClass?: string;
	disabled?: boolean;
	hoverable?: boolean;
	bordered?: boolean;
	onClick?: (e: React.MouseEvent<HTMLElement>) => void;
	onKeyDown?: (e: React.KeyboardEvent<HTMLElement>) => void;
	onKeyUp?: (e: React.KeyboardEvent<HTMLElement>) => void;
	onKeyPress?: (e: React.KeyboardEvent<HTMLElement>) => void;
	onFocus?: (e: React.FocusEvent<HTMLElement>) => void;
	onBlur?: (e: React.FocusEvent<HTMLElement>) => void;
	[key: string]: unknown;
}

function mergeRefs<T>(...refs: Array<React.Ref<T> | undefined>) {
	return (node: T) => {
		for (const ref of refs) {
			if (!ref) {
				continue;
			}
			if (typeof ref === 'function') {
				ref(node);
			} else {
				(ref as React.MutableRefObject<T | null>).current = node;
			}
		}
	};
}

export const Item = memo(
	forwardRef<HTMLElement, ItemProps>(
		(
			{
				className,
				children,
				tabIndex = 0,
				vertical,
				dense,
				active,
				activeClass,
				disabled,
				bordered,
				role,
				onClick,
				hoverable,
				component = 'li',
				...props
			},
			ref,
		) => {
			const ctx = useListContext();
			const elementRef = useRef<HTMLElement>(null);
			const handleRef = mergeRefs(ref, elementRef);
			const isActionable = useMemo(() => {
				return (
					clickableTag.includes(
						elementRef.current?.nodeName.toLowerCase() ?? String(component),
					) || typeof onClick === 'function'
				);
			}, [component, onClick]);

			const isClickable = !disabled && isActionable;
			const isHoverable = isClickable || hoverable;

			const attrs = useMemo(() => {
				const next: Record<string, unknown> = {
					className: cls(
						classes.item,
						{
							[classes.item_vertical]: vertical,
							[classes.item_active]: active,
							[classes.item_clickable]: isClickable,
							[classes.item_dense]: ctx?.dense || dense,
							[classes.item_disabled]: disabled,
							[classes.item_hoverable]: isHoverable,
							[classes.item_bordered]: bordered,
							[activeClass ?? '']: active,
						},
						className,
					),
					role: disRoleTag.includes(String(component))
						? undefined
						: (role ?? 'listitem'),
					disabled,
				};
				if (isActionable) {
					next['aria-disabled'] = disabled;
				}
				if (isClickable) {
					next.tabIndex = disabled ? -1 : (tabIndex ?? -1);
				}
				if (disDisabledTag.includes(String(component))) {
					delete next.disabled;
				}
				return next;
			}, [
				disabled,
				tabIndex,
				role,
				dense,
				active,
				className,
				activeClass,
				isHoverable,
				isClickable,
				isActionable,
				bordered,
				component,
				ctx?.dense,
				vertical,
			]);

			const Tag = (component || 'li') as 'li';

			return (
				<Tag
					{...props}
					{...attrs}
					ref={handleRef as React.Ref<HTMLLIElement>}
					onClick={(event: React.MouseEvent<HTMLElement>) => {
						if (disabled) {
							event.preventDefault();
						}
						onClick?.(event);
					}}
				>
					{children}
				</Tag>
			);
		},
	),
);
