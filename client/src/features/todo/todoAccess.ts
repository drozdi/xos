import { canUseAuthenticatedApps } from '@/core/auth/protectedApps';

/**
 * Todo/Habits: app shell open to any authenticated user (not in ProtectedAppModules).
 * List/item ACL — ownership + share on API (`IS_AUTHENTICATED_FULLY` + manager checks).
 */
export function canUseTodo(): boolean {
	return canUseAuthenticatedApps();
}
