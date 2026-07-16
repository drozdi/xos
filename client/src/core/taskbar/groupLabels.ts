export const TASKBAR_GROUP_LABELS: Record<string, string> = {
	system: 'Система',
	tools: 'Средства',
	games: 'Игры',
	admin: 'Администрирование',
	default: 'Приложения',
};

export function getTaskbarGroupLabel(groupId: string): string {
	return TASKBAR_GROUP_LABELS[groupId] ?? groupId;
}
