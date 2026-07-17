import { Box } from '@mantine/core'
import { forwardRef, memo } from 'react'
import { cls } from '../../utils'
import { ListProvider } from './ListContext'
import classes from './style.module.css'

const roleAttrExceptions = ['ul', 'ol']

interface ListProps {
	component?: any
	children?: React.ReactNode
	className?: string
	separator?: boolean
	visible?: boolean
	dense?: boolean
	bordered?: boolean
	striped?: boolean
	role?: string
	style?: React.CSSProperties
	onClick?: () => void
	onKeyDown?: () => void
	onKeyUp?: () => void
	onKeyPress?: () => void
}

export const List = memo(
	forwardRef(
		({ children, className, separator, dense, visible, bordered, striped, role, ...props }: ListProps, ref) => {
			const attrRole = roleAttrExceptions.includes(props.component) ? undefined : role ?? 'list'
			return (
				<Box
					component={props.component || 'ul'}
					{...props}
					ref={ref}
					className={cls(
						classes.list,
						{
							[classes.list_dense]: dense,
							[classes.list_visible]: visible,
							[classes.list_separator]: separator,
							[classes.list_bordered]: bordered,
							[classes.list_striped]: striped,
						},
						className
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
				</Box>
			)
		}
	)
)
