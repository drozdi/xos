import { notifications } from '@mantine/notifications';
import dayjs from 'dayjs';
import { useEffect, useRef } from 'react';

import {
	loadRemindersPrefs,
	saveRemindersPrefs,
	type LocalReminder,
} from '@/core/desktop/widgetPrefs';
import { useShellNotifications } from '@/core/notifications/shellNotificationsStore';

const POLL_MS = 30_000;

/** Fires local desktop reminders (user_app_data widget.reminders) as shell toasts. */
export function LocalRemindersWatcher() {
	const push = useShellNotifications((s) => s.push);
	const firingRef = useRef(false);

	useEffect(() => {
		let cancelled = false;

		const tick = async () => {
			if (firingRef.current || cancelled) {
				return;
			}
			firingRef.current = true;
			try {
				const prefs = await loadRemindersPrefs();
				const now = dayjs();
				let changed = false;
				const nextItems: LocalReminder[] = [];

				for (const item of prefs.items) {
					const at = dayjs(item.at);
					if (!at.isValid()) {
						nextItems.push(item);
						continue;
					}
					if (item.firedAt) {
						nextItems.push(item);
						continue;
					}
					if (at.isAfter(now)) {
						nextItems.push(item);
						continue;
					}
					// Fire once when due (or overdue within 24h)
					if (now.diff(at, 'hour', true) > 24 && item.repeat !== 'daily') {
						nextItems.push({ ...item, firedAt: now.toISOString() });
						changed = true;
						continue;
					}
					const added = push({
						kind: 'local_reminder',
						title: 'Напоминание',
						body: item.text || 'Без текста',
						dedupeKey: `local-reminder:${item.id}:${item.at}`,
						launch: item.openApp
							? { appId: item.openApp, instanceKey: 'default' }
							: {
									appId: 'widget-reminders',
									instanceKey: 'default',
								},
					});
					if (added) {
						notifications.show({
							color: 'blue',
							title: 'Напоминание',
							message: item.text || 'Без текста',
						});
					}
					if (item.repeat === 'daily') {
						let nextAt = at.add(1, 'day');
						while (!nextAt.isAfter(now)) {
							nextAt = nextAt.add(1, 'day');
						}
						nextItems.push({
							...item,
							at: nextAt.format('YYYY-MM-DDTHH:mm:ss'),
							firedAt: undefined,
						});
					} else {
						nextItems.push({ ...item, firedAt: now.toISOString() });
					}
					changed = true;
				}

				if (changed && !cancelled) {
					await saveRemindersPrefs({ items: nextItems });
				}
			} catch {
				/* ignore offline / auth */
			} finally {
				firingRef.current = false;
			}
		};

		void tick();
		const id = window.setInterval(() => {
			void tick();
		}, POLL_MS);
		return () => {
			cancelled = true;
			window.clearInterval(id);
		};
	}, [push]);

	return null;
}
