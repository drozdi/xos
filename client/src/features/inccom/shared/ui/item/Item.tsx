import { Box } from '@mantine/core'
import { useMergedRef } from '@mantine/hooks'
import { forwardRef, memo, useMemo, useRef } from 'react'
import { cls } from '../../utils'
import { useListContext } from '../list/ListContext'
import classes from './style.module.css'
const clickableTag = ['a', 'label', 'button']
const disRoleTag = ['label']
const disDisabledTag = ['div', 'span', 'a', 'label']

interface ItemProps {
	component?: any
	children?: React.ReactNode
	className?: string
	role?: string
	tabIndex?: number
	vertical?: boolean
	dense?: boolean
	active?: boolean
	activeClass?: string
	disabled?: boolean
	hoverable?: boolean
	bordered?: boolean
	onClick?: (e: React.MouseEvent<HTMLElement>) => void
	onKeyDown?: (e: React.KeyboardEvent<HTMLElement>) => void
	onKeyUp?: (e: React.KeyboardEvent<HTMLElement>) => void
	onKeyPress?: (e: React.KeyboardEvent<HTMLElement>) => void
	onFocus?: (e: React.FocusEvent<HTMLElement>) => void
	onBlur?: (e: React.FocusEvent<HTMLElement>) => void
	[key: string]: any
}

export const Item = memo(
	forwardRef(
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
				...props
			}: ItemProps,
			ref
		) => {
			const ctx = useListContext()
			const elementRef = useRef<HTMLElement>(null)
			const handleRef = useMergedRef(ref, elementRef)
			const isActionable = useMemo(() => {
				return (
					clickableTag.includes(elementRef.current?.nodeName.toLowerCase() ?? props.component) ||
					typeof onClick === 'function'
				)
			}, [props.component, elementRef.current, onClick])

			const isClickable = !disabled && isActionable
			const isHoverable = isClickable || hoverable

			const attrs = useMemo(() => {
				const attrs: Record<string, any> = {
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
							[activeClass]: active,
						},
						className
					),
					role: disRoleTag.includes(props.component) ? undefined : role ?? 'listitem',
					disabled: disabled,
				}
				if (isActionable) {
					attrs['aria-disabled'] = disabled
				}
				if (isClickable) {
					attrs.tabIndex = disabled ? -1 : tabIndex ?? -1
				}
				if (disDisabledTag.includes(props.component)) {
					delete attrs.disabled
				}
				return attrs
			}, [disabled, tabIndex, role, dense, active, className, activeClass, isHoverable, isClickable, isActionable])

			return (
				<Box
					component='li'
					{...props}
					{...attrs}
					ref={handleRef}
					onClick={(event: React.MouseEvent<HTMLElement>) => {
						if (disabled) {
							event.preventDefault()
						}
						onClick?.(event)
					}}
				>
					{children}
				</Box>
			)
		}
	)
)
