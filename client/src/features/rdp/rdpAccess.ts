import { isAppRoot, isRoot } from '@/core/auth/coreRoles';
import { canUseAppModule } from '@/core/auth/protectedApps';

export function canUseRdp(): boolean {
	return canUseAppModule('rdp');
}

export function canManageRdpNetworks(): boolean {
	return isRoot() || isAppRoot('rdp');
}
