import { memo } from 'react'
import { cls } from '../../utils'
import classes from './style.module.css'

interface ItemSectionProps {
	children?: React.ReactNode
	className?: string
	side?: boolean
	end?: boolean
	top?: boolean
	row?: boolean
	noWrap?: boolean
	avatar?: boolean
	thumbnail?: boolean
	left?: boolean
	[key: string]: any
}

export const ItemSection = memo(
	({ children, className, side, top, end, noWrap, row, avatar, thumbnail, left, ...props }: ItemSectionProps) => {
		const isSide = side || thumbnail || avatar
		return (
			<div
				{...props}
				className={cls(
					classes.section,
					{
						[classes.section_main]: !isSide,
						[classes.section_side]: isSide,
						[classes.section_top]: top,
						[classes.section_row]: row,
						[classes.section_end]: end,
						[classes.section_nowrap]: noWrap,
						[classes.section_avatar]: avatar,
						[classes.section_left]: left,
						[classes.section_thumbnail]: thumbnail,
					},
					className
				)}
			>
				{children}
			</div>
		)
	}
)
