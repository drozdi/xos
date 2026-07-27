import { Button, Flex, Layout, Menu, Typography } from 'antd';
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

const { Header, Sider, Content } = Layout;

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
		return <Typography.Text type="danger">Приложение не найдено: {appId}</Typography.Text>;
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
		<Flex align="center" justify="center" style={{ height: '100%', padding: 24 }}>
			Загрузка…
		</Flex>
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
		<Layout style={{ height: '100%', minHeight: '100vh', overflow: 'hidden' }}>
			<Sider
				breakpoint="lg"
				collapsedWidth={64}
				width={220}
				style={{ flexShrink: 0, zIndex: 2, overflow: 'auto' }}
			>
				<div style={{ padding: '16px 12px', color: '#fff', fontWeight: 600 }}>Школа</div>
				<Menu
					theme="dark"
					mode="inline"
					selectedKeys={selectedKey ? [selectedKey] : []}
					items={menuItems}
					onClick={({ key }) => navigate(key)}
				/>
			</Sider>
			<Layout style={{ flex: 1, minWidth: 0, minHeight: 0, overflow: 'hidden' }}>
				<Header
					style={{
						background: 'var(--ant-color-bg-container, #fff)',
						paddingInline: 16,
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'space-between',
						borderBottom: '1px solid rgba(0,0,0,0.06)',
						flexShrink: 0,
					}}
				>
					<Typography.Text>{user?.alias ?? user?.email ?? user?.login ?? ''}</Typography.Text>
					<Button
						onClick={() => {
							void schooltaskEmailLogout().then(() => navigate('/auth/sign-in', { replace: true }));
						}}
					>
						Выйти
					</Button>
				</Header>
				<Content
					style={{
						position: 'relative',
						flex: 1,
						minHeight: 0,
						minWidth: 0,
						padding: 0,
						overflow: 'hidden',
					}}
				>
					<Suspense fallback={<Fallback />}>
						<Outlet />
					</Suspense>
				</Content>
			</Layout>
		</Layout>
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
