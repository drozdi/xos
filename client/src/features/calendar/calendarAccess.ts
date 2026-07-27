import { canUseAppModule } from '@/core/auth/protectedApps';

export function canUseCalendar(): boolean {
	return canUseAppModule('calendar');
}
