import { SpinnerBase } from './SpinnerBase'

interface SpinnerPieProps {
	size?: string | number
	color?: 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'danger'
}
export function SpinnerPie({ size = '1em', color }: SpinnerPieProps) {
	return (
		<SpinnerBase size={size} color={color} viewBox='0 0 100 100' fill='currentColor' preserveAspectRatio='xMidYMid'>
			<path d='M0 50A50 50 0 0 1 50 0L50 50L0 50' fill='currentColor' opacity='0.5'>
				<animateTransform
					attributeName='transform'
					type='rotate'
					from='0 50 50'
					to='360 50 50'
					dur='0.8s'
					repeatCount='indefinite'
				></animateTransform>
			</path>
			<path d='M50 0A50 50 0 0 1 100 50L50 50L50 0' fill='currentColor' opacity='0.5'>
				<animateTransform
					attributeName='transform'
					type='rotate'
					from='0 50 50'
					to='360 50 50'
					dur='1.6s'
					repeatCount='indefinite'
				></animateTransform>
			</path>
			<path d='M100 50A50 50 0 0 1 50 100L50 50L100 50' fill='currentColor' opacity='0.5'>
				<animateTransform
					attributeName='transform'
					type='rotate'
					from='0 50 50'
					to='360 50 50'
					dur='2.4s'
					repeatCount='indefinite'
				></animateTransform>
			</path>
			<path d='M50 100A50 50 0 0 1 0 50L50 50L50 100' fill='currentColor' opacity='0.5'>
				<animateTransform
					attributeName='transform'
					type='rotate'
					from='0 50 50'
					to='360 50 50'
					dur='3.2s'
					repeatCount='indefinite'
				></animateTransform>
			</path>
		</SpinnerBase>
	)
}
