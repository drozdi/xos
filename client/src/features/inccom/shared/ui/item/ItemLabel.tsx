import { memo } from 'react'
import { cls } from '../../utils'
import classes from './style.module.css'

interface ItemLabelProps {
	children: React.ReactNode
	className?: string
	overline?: boolean
	caption?: boolean
	header?: boolean
	lines?: boolean
	[key: string]: any
}

export const ItemLabel = memo(({ children, className, overline, caption, header, lines, ...props }: ItemLabelProps) => {
	return (
		<div
			{...props}
			className={cls(
				classes.label,
				{
					[classes.label_overline]: overline,
					[classes.label_caption]: caption,
					[classes.label_header]: header,
					[classes.label_lines]: lines,
				},
				className
			)}
		>
			{children}
		</div>
	)
})
