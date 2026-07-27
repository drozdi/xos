import { AppShell, Button, Center, NavLink, Stack, Text } from '@mantine/core';
import { lazy, Suspense, useMemo } from 'react';
import { Outlet, useLocation, useNavigate, useParams } from 'react-router-dom';

import { AppRegistry } from '@/core/appManager/AppRegistry';
import { AppProvider } from '@/core/context/AppContext';
import { CoreApiProvider } from '@/core/context/CoreApiContext';
import { useAuthStore } from '@/core/auth/authStore';
import {
	canCreateSchooltaskClass,
	canCreateSchooltaskSubject,
	canReadSchooltaskClass,
	canReadSchooltaskEvent,
	canReadSchooltaskSubject,
	canUpdateSchooltaskEvent,
} from '@/features/schooltask/schooltaskAccess';

import { schooltaskEmailLogout } from './authApi';
import { createSchooltaskStandaloneCoreApi } from './createStandaloneCoreApi';

const SchooltaskCalendarsApp = lazy(() => import('@/apps/schooltask-calendars/SchooltaskCalendarsApp'));
const SchooltaskCalendarApp = lazy(() => import('@/apps/schooltask-calendar/SchooltaskCalendarApp'));
const SchooltaskCalendarEditorApp = lazy(
	() => import('@/apps/schooltask-calendar-editor/SchooltaskCalendarEditorApp'),
);
const SchooltaskCalendarTeacherApp = lazy(
	() => import('@/apps/schooltask-calendar-teacher/SchooltaskCalendarTeacherApp'),
);
const SchooltaskClassesApp = lazy(() => import('@/apps/schooltask-classes/SchooltaskClassesApp'));
const SchooltaskClassApp = lazy(() => import('@/apps/schooltask-class/SchooltaskClassApp'));
const SchooltaskSubjectsApp = lazy(() => import('@/apps/schooltask-subjects/SchooltaskSubjectsApp'));
const SchooltaskSubjectApp = lazy(() => import('@/apps/schooltask-subject/SchooltaskSubjectApp'));

function AppHost({
	appId,
	instanceKey = '0',
	children,
}: {
	appId: string;
	instanceKey?: string;
	children: React.ReactNode;
}) {
	const manifest = AppRegistry.get(appId);
	if (!manifest) {
		return <Text c="red">Приложение не найдено: {appId}</Text>;
	}

	return (
		<AppProvider
			value={{
				appId,
				windowId: 'schooltask-standalone',
				instanceKey,
				manifest,
			}}
		>
			<CoreApiProvider coreApi={createSchooltaskStandaloneCoreApi(appId)}>
				<div
					style={{
						position: 'relative',
						height: '100%',
						minHeight: 0,
						minWidth: 0,
						display: 'flex',
						flexDirection: 'column',
						overflow: 'hidden',
					}}
				>
					{children}
				</div>
			</CoreApiProvider>
		</AppProvider>
	);
}

function Fallback() {
	return (
		<Center h="100%" p="md">
			Загрузка…
		</Center>
	);
}

export function SchooltaskStandaloneLayout() {
	const navigate = useNavigate();
	const location = useLocation();
	const user = useAuthStore((s) => s.user);

	const scopes = useAuthStore((s) => s.scopes);
	const roles = useAuthStore((s) => s.user?.roles);

	const menuItems = useMemo(() => {
		const items: { key: string; label: string }[] = [];
		if (canReadSchooltaskEvent() || canUpdateSchooltaskEvent()) {
			items.push({ key: '/calendars', label: 'Расписание' });
			items.push({ key: '/teacher', label: 'Моё расписание' });
		}
		if (canReadSchooltaskClass() || canCreateSchooltaskClass()) {
			items.push({ key: '/classes', label: 'Классы' });
		}
		if (canReadSchooltaskSubject() || canCreateSchooltaskSubject()) {
			items.push({ key: '/subjects', label: 'Предметы' });
		}
		return items;
	}, [scopes, roles]);

	const selectedKey =
		menuItems.find((item) => location.pathname === item.key || location.pathname.startsWith(`${item.key}/`))
			?.key ?? menuItems[0]?.key;

	return (
		<AppShell
			navbar={{ width: 220, breakpoint: 'sm' }}
			header={{ height: 52 }}
			padding={0}
			style={{ height: '100%', minHeight: '100vh' }}
		>
			<AppShell.Navbar p="xs">
				<Text fw={600} mb="sm" px="xs">
					Школа
				</Text>
				<Stack gap={4}>
					{menuItems.map((item) => (
						<NavLink
							key={item.key}
							label={item.label}
							active={selectedKey === item.key}
							onClick={() => navigate(item.key)}
						/>
					))}
				</Stack>
			</AppShell.Navbar>
			<AppShell.Header px="md">
				<div
					style={{
						height: '100%',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'space-between',
					}}
				>
					<Text size="sm">{user?.alias ?? user?.email ?? user?.login ?? ''}</Text>
					<Button
						variant="default"
						size="compact-sm"
						onClick={() => {
							void schooltaskEmailLogout().then(() => navigate('/auth/sign-in', { replace: true }));
						}}
					>
						Выйти
					</Button>
				</div>
			</AppShell.Header>
			<AppShell.Main
				style={{
					position: 'relative',
					height: 'calc(100vh - 52px)',
					minHeight: 0,
					minWidth: 0,
					overflow: 'hidden',
				}}
			>
				<Suspense fallback={<Fallback />}>
					<Outlet />
				</Suspense>
			</AppShell.Main>
		</AppShell>
	);
}

export function CalendarsPage() {
	return (
		<AppHost appId="schooltask-calendars">
			<SchooltaskCalendarsApp />
		</AppHost>
	);
}

export function CalendarViewPage() {
	const { id = '0' } = useParams();
	return (
		<AppHost appId="schooltask-calendar" instanceKey={id}>
			<SchooltaskCalendarApp />
		</AppHost>
	);
}

export function CalendarEditPage() {
	const { id = '0' } = useParams();
	return (
		<AppHost appId="schooltask-calendar-editor" instanceKey={id}>
			<SchooltaskCalendarEditorApp />
		</AppHost>
	);
}

export function TeacherPage() {
	return (
		<AppHost appId="schooltask-calendar-teacher">
			<SchooltaskCalendarTeacherApp />
		</AppHost>
	);
}

export function ClassesPage() {
	return (
		<AppHost appId="schooltask-classes">
			<SchooltaskClassesApp />
		</AppHost>
	);
}

export function ClassPage() {
	const { id = '0' } = useParams();
	return (
		<AppHost appId="schooltask-class" instanceKey={id}>
			<SchooltaskClassApp />
		</AppHost>
	);
}

export function SubjectsPage() {
	return (
		<AppHost appId="schooltask-subjects">
			<SchooltaskSubjectsApp />
		</AppHost>
	);
}

export function SubjectPage() {
	const { id = '0' } = useParams();
	return (
		<AppHost appId="schooltask-subject" instanceKey={id}>
			<SchooltaskSubjectApp />
		</AppHost>
	);
}
