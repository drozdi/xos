import { canUseAppModule } from '@/core/auth/protectedApps';

export function canUseSamba(): boolean {
	return canUseAppModule('samba');
}
