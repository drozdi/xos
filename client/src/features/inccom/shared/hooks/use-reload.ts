import { useInterval } from '@mantine/hooks'
import { useEffect } from 'react'
import { $setting } from '..'

export function useReload(fn: () => void, time = $setting.get('timeReload')) {
	const autoReload = useInterval(fn, time > 0 ? time : 1)
	useEffect(() => {
		if (time === 0) {
			return
		}
		autoReload.start()
		return autoReload.stop
	}, [autoReload, time])
}
