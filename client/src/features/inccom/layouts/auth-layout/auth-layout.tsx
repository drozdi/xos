import { Center } from '@mantine/core'
import { Outlet } from 'react-router-dom'

export function AuthLayout() {
	return (
		<Center w='100vw' h='100vh'>
			<Outlet />
		</Center>
	)
}
