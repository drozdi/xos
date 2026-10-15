import { Box, Checkbox, Modal, Select, Stack, Text } from '@mantine/core';
import { useCallback, useEffect, useState } from 'react';

import {
	loadClockPrefs,
	saveClockPrefs,
	type WidgetClockPrefs,
} from '@/core/desktop/widgetPrefs';
import { WidgetBody } from '@/core/desktop/WidgetSurface';
import { useWidgetSettingsTick } from '@/core/desktop/useWidgetSettingsTick';
import { useWindowTitle } from '@/core/hooks/useWindowTitle';

const CLOCK_ZONES = [
	{ value: '', label: 'Локальное' },
	{ value: 'UTC', label: 'UTC' },
	{ value: 'Europe/Kaliningrad', label: 'Калининград' },
	{ value: 'Europe/Moscow', label: 'Москва' },
	{ value: 'Asia/Yekaterinburg', label: 'Екатеринбург' },
	{ value: 'Asia/Novosibirsk', label: 'Новосибирск' },
	{ value: 'Asia/Vladivostok', label: 'Владивосток' },
];

export default function WidgetClockApp() {
	useWindowTitle('Часы');
	const [now, setNow] = useState(() => new Date());
	const [prefs, setPrefs] = useState<WidgetClockPrefs>({ hour12: false, showDate: true, timeZone: '' });
	const [settingsOpen, setSettingsOpen] = useState(false);

	useWidgetSettingsTick(useCallback(() => setSettingsOpen(true), []));

	useEffect(() => {
		void loadClockPrefs().then(setPrefs);
	}, []);

	useEffect(() => {
		const id = window.setInterval(() => setNow(new Date()), 1000);
		return () => window.clearInterval(id);
	}, []);

	const zone = prefs.timeZone || undefined;
	const timeParts = new Intl.DateTimeFormat('ru-RU', {
		timeZone: zone,
		hour: '2-digit',
		minute: '2-digit',
		hour12: prefs.hour12,
	}).format(now);
	const time = timeParts;
	const date = new Intl.DateTimeFormat('ru-RU', {
		timeZone: zone,
		weekday: 'short',
		day: 'numeric',
		month: 'short',
	}).format(now);

	const persist = async (next: WidgetClockPrefs) => {
		setPrefs(next);
		await saveClockPrefs(next);
	};

	return (
		<>
			<WidgetBody>
				<Box
					h="100%"
					px={12}
					py={6}
					style={{
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
					}}
				>
					<Stack gap={0} align="center">
						<Text
							fw={600}
							style={{
								fontSize: 22,
								lineHeight: 1.05,
								fontVariantNumeric: 'tabular-nums',
								letterSpacing: 0.5,
							}}
						>
							{time}
						</Text>
						{prefs.showDate ? (
							<Text size="xs" c="dimmed" tt="capitalize" style={{ opacity: 0.8, fontSize: 11 }}>
								{date}
							</Text>
						) : null}
					</Stack>
				</Box>
			</WidgetBody>
			<Modal
				opened={settingsOpen}
				onClose={() => setSettingsOpen(false)}
				title="Настройки часов"
				centered
				size="xs"
			>
				<Stack gap="sm">
					<Checkbox
						label="12-часовой формат"
						checked={prefs.hour12}
						onChange={(e) => {
							void persist({ ...prefs, hour12: e.currentTarget.checked });
						}}
					/>
					<Checkbox
						label="Показывать дату"
						checked={prefs.showDate}
						onChange={(e) => {
							void persist({ ...prefs, showDate: e.currentTarget.checked });
						}}
					/>
					<Select
						label="Часовой пояс"
						data={CLOCK_ZONES}
						value={prefs.timeZone}
						onChange={(value) => {
							void persist({ ...prefs, timeZone: value ?? '' });
						}}
					/>
				</Stack>
			</Modal>
		</>
	);
}
