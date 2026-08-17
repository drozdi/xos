import { canUseAppModule } from '@/core/auth/protectedApps';

export function canUseBoard(): boolean {
	return canUseAppModule('board');
}
