import { canUseAppModule } from '@/core/auth/protectedApps';

export function canUseGithub(): boolean {
	return canUseAppModule('github');
}
