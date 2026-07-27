import { CalendarShell } from '@/features/calendar/components/CalendarShell';
import { useWindowTitle } from '@/core/hooks/useWindowTitle';

export default function CalendarApp() {
	useWindowTitle('Календарь');
	return <CalendarShell />;
}
