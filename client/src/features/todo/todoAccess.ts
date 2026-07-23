import { canUseAuthenticatedApps } from '@/core/auth/protectedApps';

export function canUseTodo(): boolean {
	return canUseAuthenticatedApps();
}
