import { canUseAppModule } from '@/core/auth/protectedApps';

export function canUseTeamStorm(): boolean {
	return canUseAppModule('ts');
}
