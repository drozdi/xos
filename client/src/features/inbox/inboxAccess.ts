import { canUseAppModule } from '@/core/auth/protectedApps';

export function canUseInbox(): boolean {
	return canUseAppModule('inbox');
}
