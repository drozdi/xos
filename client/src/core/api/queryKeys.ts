import type { ListRequest, SettingCategory } from '@/types/api.types';

export const queryKeys = {
	auth: {
		user: ['auth', 'user'] as const,
		check: ['auth', 'check'] as const,
	},
	account: {
		detail: ['account', 'detail'] as const,
		map: ['account', 'map'] as const,
		accesses: ['account', 'accesses'] as const,
		roles: ['account', 'roles'] as const,
		options: ['account', 'options'] as const,
	},
	settings: {
		all: (category?: SettingCategory) => ['settings', category ?? 'all'] as const,
		one: (category: SettingCategory, key: string) => ['settings', category, key] as const,
	},
	main: {
		users: (filters: ListRequest) => ['main', 'users', filters] as const,
		user: (id: number) => ['main', 'user', id] as const,
		userFilter: ['main', 'user', 'filter'] as const,
		userSelect: (filters?: ListRequest['filters']) => ['main', 'user', 'select', filters] as const,
		userRoleOptions: ['main', 'user', 'role-options'] as const,
		groups: (filters: ListRequest) => ['main', 'groups', filters] as const,
		group: (id: number) => ['main', 'group', id] as const,
		groupFilter: ['main', 'group', 'filter'] as const,
		ous: (filters: ListRequest) => ['main', 'ous', filters] as const,
		ou: (id: number) => ['main', 'ou', id] as const,
		ouSelect: (filters?: ListRequest['filters']) => ['main', 'ou', 'select', filters] as const,
		claimants: (filters: ListRequest) => ['main', 'claimants', filters] as const,
		appAccessModules: ['main', 'claimant', 'app-access-modules'] as const,
		claimant: (id: number) => ['main', 'claimant', id] as const,
	},
	schooltask: {
		subjects: (filters: ListRequest) => ['schooltask', 'subjects', filters] as const,
		subject: (id: number) => ['schooltask', 'subject', id] as const,
		subjectTeachers: ['schooltask', 'subject', 'teachers'] as const,
		classes: (filters: ListRequest) => ['schooltask', 'classes', filters] as const,
		class: (id: number) => ['schooltask', 'class', id] as const,
		classParallels: ['schooltask', 'class', 'parallels'] as const,
		classSubjects: ['schooltask', 'class', 'subjects-options'] as const,
		classTutors: ['schooltask', 'class', 'tutors'] as const,
		classPupils: ['schooltask', 'class', 'pupils'] as const,
		calendarClasses: ['schooltask', 'calendar', 'classes'] as const,
		calendarInfo: (classId: number) => ['schooltask', 'calendar', 'info', classId] as const,
		studentEvents: (classId: number, range: { start: string; end: string }) =>
			['schooltask', 'calendar', 'student', classId, range] as const,
		studentEvent: (classId: number, id: number) =>
			['schooltask', 'calendar', 'student', classId, id] as const,
		editorEvents: (classId: number, range: { start: string; end: string }) =>
			['schooltask', 'calendar', 'editor', classId, range] as const,
		editorSubgroups: (classId: number) => ['schooltask', 'calendar', 'editor', 'subgroups', classId] as const,
		editorTeachers: (classId: number, subjectId: number) =>
			['schooltask', 'calendar', 'editor', 'teachers', classId, subjectId] as const,
		editorEvent: (classId: number, id: number) =>
			['schooltask', 'calendar', 'editor', classId, id] as const,
		teacherEvents: (range: { start: string; end: string }) =>
			['schooltask', 'calendar', 'teacher', range] as const,
		teacherEvent: (id: number) => ['schooltask', 'calendar', 'teacher', id] as const,
		teacherFiles: ['schooltask', 'calendar', 'teacher', 'files'] as const,
	},
	device: {
		list: (filters: ListRequest) => ['device', 'list', filters] as const,
		detail: (id: number) => ['device', 'detail', id] as const,
		filter: ['device', 'filter'] as const,
		devices: (filters: ListRequest) => ['device', 'devices', filters] as const,
		device: (id: number) => ['device', 'device', id] as const,
		subDevices: (filters: ListRequest) => ['device', 'subDevices', filters] as const,
		subDeviceFilter: ['device', 'subDevice', 'filter'] as const,
		subDevice: (id: number) => ['device', 'subDevice', id] as const,
		types: (filters: ListRequest) => ['device', 'types', filters] as const,
		type: (id: number) => ['device', 'type', id] as const,
		properties: (filters: ListRequest) => ['device', 'properties', filters] as const,
		property: (id: number) => ['device', 'property', id] as const,
		components: (filters: ListRequest) => ['device', 'components', filters] as const,
		component: (id: number) => ['device', 'component', id] as const,
		software: (filters: ListRequest) => ['device', 'software', filters] as const,
		softwareDetail: (id: number) => ['device', 'software', 'detail', id] as const,
		softwareTypes: (filters: ListRequest) => ['device', 'softwareTypes', filters] as const,
		softwareType: (id: number) => ['device', 'softwareType', id] as const,
		licenses: (filters: ListRequest) => ['device', 'licenses', filters] as const,
		license: (id: number) => ['device', 'license', id] as const,
		licenseKeys: (filters: ListRequest) => ['device', 'licenseKeys', filters] as const,
		licenseKey: (id: number) => ['device', 'licenseKey', id] as const,
	},
	explorer: {
		config: ['explorer', 'config'] as const,
		list: (path: string, sortBy: string, sortDir: string) =>
			['explorer', 'list', path, sortBy, sortDir] as const,
		tree: (path: string, depth: number) => ['explorer', 'tree', path, depth] as const,
		trash: (disk: string) => ['explorer', 'trash', disk] as const,
		disks: ['explorer', 'disks'] as const,
	},
	todo: {
		lists: ['todo', 'lists'] as const,
		list: (id: number) => ['todo', 'list', id] as const,
	},
	calendar: {
		calendars: ['calendar', 'calendars'] as const,
		events: (range: { start: string; end: string }, ids?: number[]) =>
			['calendar', 'events', range, ids ?? null] as const,
		dueItems: (range: { start: string; end: string }) =>
			['calendar', 'dueItems', range] as const,
	},
	board: {
		workspaces: ['board', 'workspaces'] as const,
		workspace: (id: number) => ['board', 'workspace', id] as const,
		boards: (workspaceId: number) => ['board', 'boards', workspaceId] as const,
		board: (id: number) => ['board', 'board', id] as const,
		card: (id: number) => ['board', 'card', id] as const,
		members: (boardId: number) => ['board', 'members', boardId] as const,
		filter: (boardId: number, params: Record<string, unknown>) =>
			['board', 'filter', boardId, params] as const,
	},
} as const;
