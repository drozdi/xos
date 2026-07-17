import { useInterval } from '@mantine/hooks'
import { useEffect } from 'react'
import { $setting } from '..'

export function useReload(fn: () => void, time = $setting.get('timeReload')) {
	if (time === 0) {
		return
	}
	const autoReload = useInterval(fn, time)
	useEffect(() => {
		autoReload.start()
		return autoReload.stop
	}, [])
}
