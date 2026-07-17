import { memo, useMemo } from 'react'
import { cls } from '../../utils'
import classes from './style.module.css'

interface ProgressBarProps {
	children?: React.ReactNode
	className?: string
	value?: number
	buffer?: number
	color?: 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'danger'
	label?: boolean
	stripe?: boolean
	animation?: boolean
	indeterminate?: boolean
	thickness?: number
	reverse?: boolean
	size?: number
}

export function ProgressBarRoot({
	children,
	className,
	value,
	buffer,
	color,
	label,
	stripe,
	animation,
	indeterminate,
	thickness,
	reverse,
}: ProgressBarProps) {
	const attrs = useMemo(() => ({
		role: 'progressbar',
		'aria-valuemin': 0,
		'aria-valuemax': 100,
		'aria-valuenow': indeterminate === true ? void 0 : value,
	}))
	const trackAttrs = useMemo(
		() => ({
			style: { width: buffer && !indeterminate ? `${buffer}%` : '' },
		}),
		[buffer, indeterminate]
	)
	const valueAttrs = useMemo(
		() => ({
			style: { width: value && !indeterminate ? `${value}%` : '' },
		}),
		[value, indeterminate]
	)

	return (
		<div
			{...attrs}
			className={cls(
				classes.progress_bar,
				{
					[classes.progress_bar_stripe]: !indeterminate && stripe,
					[classes.progress_bar_animation]: !indeterminate && animation,
					[classes.progress_bar_indeterminate]: indeterminate,
					[classes.progress_bar_reverse]: reverse,
					[`text-${color}`]: color,
				},
				className
			)}
			style={{ height: thickness }}
		>
			<div {...trackAttrs} className={classes.progress_bar__track}></div>
			<div {...valueAttrs} className={classes.progress_bar__value}></div>
			{!indeterminate && children && <div className={classes.progress_bar__label}>{children}</div>}
			{!indeterminate && !children && label && <div className={classes.progress_bar__label}>{value}%</div>}
		</div>
	)
}

export const ProgressBar = memo(ProgressBarRoot)
