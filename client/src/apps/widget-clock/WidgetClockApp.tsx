import { Box, Checkbox, Modal, Stack, Text } from '@mantine/core';
import { useCallback, useEffect, useState } from 'react';

import {
	loadClockPrefs,
	saveClockPrefs,
	type WidgetClockPrefs,
} from '@/core/desktop/widgetPrefs';
import { WidgetBody } from '@/core/desktop/WidgetSurface';
import { useWidgetSettingsTick } from '@/core/desktop/useWidgetSettingsTick';
import { useWindowTitle } from '@/core/hooks/useWindowTitle';

function pad(n: number): string {
	return String(n).padStart(2, '0');
}

export default function WidgetClockApp() {
	useWindowTitle('Часы');
	const [now, setNow] = useState(() => new Date());
	const [prefs, setPrefs] = useState<WidgetClockPrefs>({ hour12: false, showDate: true });
	const [settingsOpen, setSettingsOpen] = useState(false);

	useWidgetSettingsTick(useCallback(() => setSettingsOpen(true), []));

	useEffect(() => {
		void loadClockPrefs().then(setPrefs);
	}, []);

	useEffect(() => {
		const id = window.setInterval(() => setNow(new Date()), 1000);
		return () => window.clearInterval(id);
	}, []);

	const hours24 = now.getHours();
	const hours = prefs.hour12 ? ((hours24 + 11) % 12) + 1 : hours24;
	const suffix = prefs.hour12 ? (hours24 >= 12 ? ' PM' : ' AM') : '';
	const time = `${pad(hours)}:${pad(now.getMinutes())}${suffix}`;
	const date = now.toLocaleDateString('ru-RU', {
		weekday: 'short',
		day: 'numeric',
		month: 'short',
	});

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
				</Stack>
			</Modal>
		</>
	);
}
