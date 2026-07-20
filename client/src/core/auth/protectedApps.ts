import { canAccessApp, isRole } from '@/core/auth/coreRoles';

/** Модули, доступ к которым задаётся вкладкой «Доступ к приложениям». */
export const PROTECTED_APP_MODULES = [
	'main',
	'device',
	'explorer',
	'schooltask',
	'inccom',
] as const;

export type ProtectedAppModule = (typeof PROTECTED_APP_MODULES)[number];

export function isProtectedAppModule(module: string): boolean {
	return (PROTECTED_APP_MODULES as readonly string[]).includes(module.toLowerCase());
}

/** Авторизованный пользователь с ROLE_USER (или ROLE_ROOT). */
export function canUseAuthenticatedApps(): boolean {
	return isRole('user') || isRole('root');
}

/**
 * Доступ к модулю: для защищённых — ROLE_{module}/ROLE_{module}_ROOT,
 * для остальных — достаточно авторизации.
 */
export function canUseAppModule(module: string): boolean {
	if (!canUseAuthenticatedApps()) {
		return false;
	}

	if (!isProtectedAppModule(module)) {
		return true;
	}

	return canAccessApp(module);
}
