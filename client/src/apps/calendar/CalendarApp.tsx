import { useAppContext } from '@/core/context/AppContext';
import { useWindowTitle } from '@/core/hooks/useWindowTitle';
import { CalendarShell } from '@/features/calendar/components/CalendarShell';

export default function CalendarApp() {
	useWindowTitle('Календарь');
	const { props } = useAppContext();
	const focusDate =
		typeof props?.focusDate === 'string' && /^\d{4}-\d{2}-\d{2}/.test(props.focusDate)
			? props.focusDate.slice(0, 10)
			: undefined;

	return <CalendarShell initialDate={focusDate} />;
}
