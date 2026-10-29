export const TASKBAR_GROUP_LABELS: Record<string, string> = {
	system: 'Система',
	tools: 'Стандартные',
	games: 'Игры',
	admin: 'Администрирование',
	default: 'Приложения',
	recipes: 'Рецепты',
	notes: 'Заметки',
};

export function getTaskbarGroupLabel(groupId: string): string {
	return TASKBAR_GROUP_LABELS[groupId] ?? groupId;
}
