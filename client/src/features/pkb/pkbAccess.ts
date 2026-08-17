import { canUseAppModule } from '@/core/auth/protectedApps';

export function canUsePkb(): boolean {
	return canUseAppModule('pkb');
}
