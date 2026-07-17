import { memo, useMemo } from 'react'
import { cls } from '../../utils'
import classes from './style.module.css'

interface ProgressCircleProps {
	children?: React.ReactNode
	className?: string
	value?: number
	buffer?: number
	color?: 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'danger'
	label?: boolean
	indeterminate?: boolean
	size?: number
	thickness?: number
	reverse?: boolean
}

export function ProgressCircleRoot({
	children,
	className,
	value,
	buffer,
	color,
	label,
	indeterminate,
	size,
	thickness,
	reverse,
}: ProgressCircleProps) {
	const attrs = useMemo(() => ({
		role: 'progressbar',
		'aria-valuemin': 0,
		'aria-valuemax': 100,
		'aria-valuenow': indeterminate === true ? void 0 : value,
	}))

	const radius = useMemo(() => size / 2 - thickness / 2, [size, thickness])
	const circumference = useMemo(() => 2 * Math.PI * radius, [radius])
	const normalizedValue = useMemo(() => Math.max(0, Math.min(100, parseFloat(value))), [value])
	const normalizedBuffer = useMemo(() => Math.max(0, Math.min(100, parseFloat(buffer))), [buffer])
	const strokeDashOffset = useMemo(
		() => ((100 - normalizedValue) / 100) * circumference,
		[normalizedValue, circumference]
	)
	const strokeDashOffsetBuffer = useMemo(
		() => ((100 - normalizedBuffer) / 100) * circumference,
		[normalizedBuffer, circumference]
	)

	const diameter = useMemo(() => (radius / (1 - thickness / size)) * 2, [thickness, size, radius])
	const strokeWidth = useMemo(() => (thickness / size) * diameter, [thickness, size, diameter])

	return (
		<div
			{...attrs}
			style={{
				width: diameter,
				height: diameter,
			}}
			className={cls(
				classes.progress_circular,
				{
					[classes.progress_circular_indeterminate]: indeterminate,
					[classes.progress_circular_reverse]: reverse,
					[`text-${color}`]: color,
				},
				className
			)}
		>
			<svg
				style={{
					transform: `rotate(-90deg)`,
				}}
				xmlns='http://www.w3.org/2000/svg'
				viewBox={`0 0 ${diameter} ${diameter}`}
			>
				<defs>
					<linearGradient id='gradient' x1='0%' y1='0%' x2='0%' y2='100%'>
						<stop offset='0%' stopColor='var(--color-primary)' />
						<stop offset='25%' stopColor='var(--color-accent)' />
						<stop offset='50%' stopColor='var(--color-info)' />
						<stop offset='75%' stopColor='var(--color-success)' />
						<stop offset='100%' stopColor='var(--color-secondary)' />
					</linearGradient>
				</defs>
				<circle
					className={classes.progress_circular__underlay}
					fill='transparent'
					cx='50%'
					cy='50%'
					r={radius}
					strokeWidth={strokeWidth}
					strokeDasharray={circumference}
					strokeDashoffset={(reverse ? '-' : '') + (!indeterminate ? strokeDashOffsetBuffer : 0)}
				/>

				<circle
					className={classes.progress_circular__overlay}
					fill='transparent'
					cx='50%'
					cy='50%'
					r={radius}
					strokeWidth={strokeWidth}
					strokeDasharray={circumference}
					strokeDashoffset={(reverse ? '-' : '') + strokeDashOffset}
				/>
			</svg>
			{children && <div className={classes.progress_circular__label}>{children}</div>}
			{!indeterminate && !children && label && <div className={classes.progress_circular__label}>{value}%</div>}
		</div>
	)
}

export const ProgressCircle = memo(ProgressCircleRoot)
