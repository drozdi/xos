import { ActionIcon, useComputedColorScheme, useMantineColorScheme } from '@mantine/core'
import { TbMoon, TbSun } from 'react-icons/tb'

export function ThemeBtn() {
	const { setColorScheme } = useMantineColorScheme()
	const computedColorScheme = useComputedColorScheme('light', {
		getInitialValueInEffect: true,
	})
	return (
		<ActionIcon
			onClick={() => setColorScheme(computedColorScheme === 'light' ? 'dark' : 'light')}
			variant='default'
			aria-label='Toggle color scheme'
			size='xl'
			radius='100%'
		>
			<TbSun
				style={{
					display: computedColorScheme === 'light' ? 'block' : 'none',
				}}
			/>
			<TbMoon
				style={{
					display: computedColorScheme === 'dark' ? 'block' : 'none',
				}}
			/>
		</ActionIcon>
	)
}
