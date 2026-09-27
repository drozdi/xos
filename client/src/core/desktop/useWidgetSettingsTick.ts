import { useEffect, useRef } from 'react';

import { useAppContext } from '@/core/context/AppContext';

/** Opens settings when chrome ⚙ bumps `__widgetSettingsTick`. */
export function useWidgetSettingsTick(onOpen: () => void): void {
	const { props } = useAppContext();
	const tick = typeof props?.__widgetSettingsTick === 'number' ? props.__widgetSettingsTick : 0;
	const seen = useRef(0);

	useEffect(() => {
		if (tick > 0 && tick !== seen.current) {
			seen.current = tick;
			onOpen();
		}
	}, [onOpen, tick]);
}
