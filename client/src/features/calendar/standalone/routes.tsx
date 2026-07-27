import { Box, Button, Group, Text } from '@mantine/core';
import { Navigate, useRoutes } from 'react-router-dom';

import { CalendarShell } from '@/features/calendar/components/CalendarShell';

import { calendarEmailLogout } from './authApi';
import { CalendarProtectedRoute } from './ProtectedRoute';
import { CalendarSignInPage } from './SignInPage';
import { useCalendarStandalone } from './calendar-standalone';

function CalendarStandaloneHome() {
	const { standalone, navigate } = useCalendarStandalone();

	return (
		<Box
			style={{
				display: 'flex',
				flexDirection: 'column',
				height: '100%',
				minHeight: 0,
			}}
		>
			{standalone ? (
				<Group
					justify="space-between"
					px="md"
					py="xs"
					style={{ borderBottom: '1px solid var(--mantine-color-default-border)' }}
				>
					<Text fw={600}>Календарь</Text>
					<Button
						size="xs"
						variant="default"
						onClick={() => {
							void calendarEmailLogout().then(() => {
								navigate?.('/auth/sign-in', { replace: true });
							});
						}}
					>
						Выйти
					</Button>
				</Group>
			) : null}
			<Box style={{ flex: 1, minHeight: 0 }}>
				<CalendarShell />
			</Box>
		</Box>
	);
}

export function CalendarStandaloneRoutes() {
	return useRoutes([
		{ path: '/auth/sign-in', element: <CalendarSignInPage /> },
		{
			path: '/',
			element: (
				<CalendarProtectedRoute>
					<CalendarStandaloneHome />
				</CalendarProtectedRoute>
			),
		},
		{ path: '*', element: <Navigate to="/" replace /> },
	]);
}
