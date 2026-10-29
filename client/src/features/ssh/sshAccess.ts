import { canUseAppModule } from '@/core/auth/protectedApps';

export function canUseSsh(): boolean {
	return canUseAppModule('ssh');
}
