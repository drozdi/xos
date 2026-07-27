import { Navigate, useRoutes } from 'react-router-dom';

import { SchooltaskProtectedRoute } from './ProtectedRoute';
import { SchooltaskSignInPage } from './SignInPage';
import {
	CalendarEditPage,
	CalendarViewPage,
	CalendarsPage,
	ClassPage,
	ClassesPage,
	SchooltaskStandaloneLayout,
	SubjectPage,
	SubjectsPage,
	TeacherPage,
} from './pages';

export function SchooltaskStandaloneRoutes() {
	return useRoutes([
		{ path: '/auth/sign-in', element: <SchooltaskSignInPage /> },
		{
			path: '/',
			element: (
				<SchooltaskProtectedRoute>
					<SchooltaskStandaloneLayout />
				</SchooltaskProtectedRoute>
			),
			children: [
				{ index: true, element: <Navigate to="/calendars" replace /> },
				{ path: 'calendars', element: <CalendarsPage /> },
				{ path: 'calendar/:id', element: <CalendarViewPage /> },
				{ path: 'calendar/:id/edit', element: <CalendarEditPage /> },
				{ path: 'teacher', element: <TeacherPage /> },
				{ path: 'classes', element: <ClassesPage /> },
				{ path: 'classes/:id', element: <ClassPage /> },
				{ path: 'subjects', element: <SubjectsPage /> },
				{ path: 'subjects/:id', element: <SubjectPage /> },
			],
		},
		{ path: '*', element: <Navigate to="/" replace /> },
	]);
}
