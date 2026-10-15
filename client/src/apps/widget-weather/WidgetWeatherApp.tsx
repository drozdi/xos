import { Box, Button, Group, Modal, ScrollArea, Stack, Text, TextInput } from '@mantine/core';
import dayjs from 'dayjs';
import { useCallback, useEffect, useRef, useState } from 'react';

import { useWidgetSettingsTick } from '@/core/desktop/useWidgetSettingsTick';
import { WidgetBody, WidgetSkeleton } from '@/core/desktop/WidgetSurface';
import { loadWeatherPrefs, saveWeatherPrefs, type WidgetWeatherPrefs } from '@/core/desktop/widgetPrefs';
import { useCoreApi } from '@/core/hooks/useCoreApi';
import { useWindowTitle } from '@/core/hooks/useWindowTitle';
import { useWmStore } from '@/core/windowManager/useWmStore';

import {
	describeWeather,
	fetchWeather,
	geocodeCity,
	readCoordsFromGeolocation,
	type WeatherSnapshot,
} from './weatherApi';

const COLLAPSED = { width: 220, height: 96 };
const EXPANDED = { width: 220, height: 300 };
const WINDOW_ID = 'widget-weather__default';

export default function WidgetWeatherApp() {
	useWindowTitle('Погода');
	const coreApi = useCoreApi();
	const updateWindow = useWmStore((s) => s.updateWindow);
	const [city, setCity] = useState('');
	const [cities, setCities] = useState<string[]>([]);
	const [unit, setUnit] = useState<WidgetWeatherPrefs['unit']>('c');
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [weather, setWeather] = useState<WeatherSnapshot | null>(null);
	const [settingsOpen, setSettingsOpen] = useState(false);
	const [expanded, setExpanded] = useState(false);
	/** Skip click toggle after a drag gesture. */
	const suppressClickRef = useRef(false);

	useWidgetSettingsTick(useCallback(() => setSettingsOpen(true), []));

	const setWidgetSize = useCallback(
		(next: { width: number; height: number }) => {
			updateWindow(WINDOW_ID, next);
		},
		[updateWindow],
	);

	const collapseDetails = useCallback(() => {
		setExpanded(false);
		setWidgetSize(COLLAPSED);
	}, [setWidgetSize]);

	// Real drag (not click): collapse hourly list and ignore the trailing click.
	useEffect(() => {
		return coreApi.window.on('dragStart', () => {
			suppressClickRef.current = true;
			collapseDetails();
		});
	}, [collapseDetails, coreApi.window]);

	const loadByCoords = useCallback(async (lat: number, lon: number, placeName: string, nextUnit: WidgetWeatherPrefs['unit']) => {
		setLoading(true);
		setError(null);
		try {
			const snapshot = await fetchWeather(lat, lon, placeName, nextUnit);
			setWeather(snapshot);
			setLoading(false);
		} catch {
			setError('Нет данных');
			setLoading(false);
		}
	}, []);

	const loadByCity = useCallback(async (cityName: string, nextUnit: WidgetWeatherPrefs['unit'], knownCities: string[]) => {
		const trimmed = cityName.trim();
		if (!trimmed) {
			setError('Укажите город');
			setLoading(false);
			return;
		}
		setLoading(true);
		setError(null);
		try {
			const nextCities = knownCities.includes(trimmed) ? knownCities : [...knownCities, trimmed];
			setCities(nextCities);
			setUnit(nextUnit);
			await saveWeatherPrefs({ city: trimmed, cities: nextCities, unit: nextUnit });
			const place = await geocodeCity(trimmed);
			if (!place) {
				setError('Город не найден');
				setLoading(false);
				return;
			}
			const snapshot = await fetchWeather(place.lat, place.lon, place.name, nextUnit);
			setWeather(snapshot);
			setLoading(false);
		} catch {
			setError('Нет данных');
			setLoading(false);
		}
	}, []);

	const loadByGeo = useCallback(async (nextUnit: WidgetWeatherPrefs['unit']) => {
		setLoading(true);
		setError(null);
		try {
			const coords = await readCoordsFromGeolocation();
			await loadByCoords(coords.lat, coords.lon, 'Рядом', nextUnit);
		} catch {
			setError('Нет гео');
			setLoading(false);
		}
	}, [loadByCoords]);

	useEffect(() => {
		let alive = true;
		void (async () => {
			try {
				const prefs = await loadWeatherPrefs();
				if (!alive) {
					return;
				}
				setCity(prefs.city);
				setCities(prefs.cities);
				setUnit(prefs.unit);
				if (prefs.city.trim()) {
					await loadByCity(prefs.city, prefs.unit, prefs.cities);
				} else {
					await loadByGeo(prefs.unit);
				}
			} catch {
				if (alive) {
					setError('Нет prefs');
					setLoading(false);
				}
			}
		})();
		return () => {
			alive = false;
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	useEffect(() => {
		setWidgetSize(expanded ? EXPANDED : COLLAPSED);
	}, [expanded, setWidgetSize]);

	const toggleExpanded = () => {
		if (!weather) {
			return;
		}
		if (suppressClickRef.current) {
			suppressClickRef.current = false;
			return;
		}
		setExpanded((v) => !v);
	};

	const placeShort = weather?.placeName?.split(',')[0] ?? '';
	const showSkeleton = loading && !weather;

	return (
		<>
			<WidgetBody key={showSkeleton ? 'skeleton' : weather ? 'ready' : 'empty'}>
				{showSkeleton ? (
					<WidgetSkeleton />
				) : (
					<>
						<Box
							px={12}
							py={6}
							style={{
								height: COLLAPSED.height,
								flexShrink: 0,
								display: 'flex',
								alignItems: 'center',
								cursor: weather ? 'pointer' : 'default',
							}}
							onClick={toggleExpanded}
						>
							{error && !weather ? (
								<Text size="xs" c="dimmed" ta="center" w="100%">
									{error}
								</Text>
							) : null}
							{weather ? (
								<Group gap={8} wrap="nowrap" w="100%" justify="space-between" align="center">
									<Stack gap={1} style={{ minWidth: 0, flex: 1 }}>
										<Text size="xs" c="dimmed" truncate style={{ opacity: 0.8, fontSize: 11 }}>
											{placeShort}
										</Text>
										<Group gap={8} align="baseline" wrap="nowrap">
											<Text fw={700} style={{ fontSize: 26, lineHeight: 1 }}>
												{Math.round(weather.temperature)}°
											</Text>
											<Text size="xs" style={{ opacity: 0.9, fontSize: 12 }} lineClamp={1}>
												{describeWeather(weather.weatherCode)}
											</Text>
										</Group>
										<Text size="xs" c="dimmed" style={{ opacity: 0.8, fontSize: 11 }}>
											ветер {Math.round(weather.windSpeed)} км/ч
										</Text>
									</Stack>
									<Text size="xs" c="dimmed" style={{ opacity: 0.65, fontSize: 11 }}>
										{expanded ? '▴' : '▾'}
									</Text>
								</Group>
							) : null}
						</Box>

						{expanded && weather ? (
							<ScrollArea style={{ flex: 1, minHeight: 0 }} type="auto" offsetScrollbars>
								<Stack gap={2} px={10} pb={8}>
									{weather.hourly.length === 0 ? (
										<Text size="xs" c="dimmed">
											Нет прогноза
										</Text>
									) : (
										<>
											<Group justify="space-between" wrap="nowrap" gap={4}>
												<Text size="xs" c="dimmed" style={{ width: 36, fontSize: 10 }}>
													время
												</Text>
												<Text size="xs" c="dimmed" style={{ flex: 1, fontSize: 10 }}>
													—
												</Text>
												<Text
													size="xs"
													c="dimmed"
													style={{ width: 52, textAlign: 'right', fontSize: 10 }}
												>
													км/ч
												</Text>
												<Text
													size="xs"
													c="dimmed"
													style={{ width: 28, textAlign: 'right', fontSize: 10 }}
												>
													°C
												</Text>
											</Group>
											{weather.hourly.map((h) => (
												<Group key={h.time} justify="space-between" wrap="nowrap" gap={4}>
													<Text size="xs" style={{ width: 36, opacity: 0.85 }}>
														{dayjs(h.time).format('HH:mm')}
													</Text>
													<Text size="xs" style={{ flex: 1, opacity: 0.8 }} lineClamp={1}>
														{describeWeather(h.weatherCode)}
													</Text>
													<Text
														size="xs"
														c="dimmed"
														style={{ width: 52, textAlign: 'right', opacity: 0.8 }}
													>
														{Math.round(h.windSpeed)}
													</Text>
													<Text size="xs" fw={600} style={{ width: 28, textAlign: 'right' }}>
														{Math.round(h.temperature)}°
													</Text>
												</Group>
											))}
										</>
									)}
								</Stack>
							</ScrollArea>
						) : null}
					</>
				)}
			</WidgetBody>
			<Modal
				opened={settingsOpen}
				onClose={() => setSettingsOpen(false)}
				title="Настройки погоды"
				centered
				size="sm"
			>
				<Stack gap="sm">
					<Group gap="xs">
						<Button size="xs" variant={unit === 'c' ? 'filled' : 'default'} onClick={() => setUnit('c')}>
							°C
						</Button>
						<Button size="xs" variant={unit === 'f' ? 'filled' : 'default'} onClick={() => setUnit('f')}>
							°F
						</Button>
					</Group>
					{cities.length > 0 ? (
						<Group gap={4}>
							{cities.map((name) => (
								<Button
									key={name}
									size="compact-xs"
									variant={name === city ? 'light' : 'subtle'}
									onClick={() => {
										setCity(name);
										void loadByCity(name, unit, cities);
									}}
								>
									{name}
								</Button>
							))}
						</Group>
					) : null}
					<Group align="flex-end" wrap="nowrap">
						<TextInput
							label="Город"
							placeholder="Москва"
							value={city}
							onChange={(e) => setCity(e.currentTarget.value)}
							style={{ flex: 1 }}
							onKeyDown={(e) => {
								if (e.key === 'Enter') {
									void loadByCity(city, unit, cities);
								}
							}}
						/>
						<Button size="sm" loading={loading} onClick={() => void loadByCity(city, unit, cities)}>
							OK
						</Button>
					</Group>
					<Group gap="xs">
						<Button size="xs" variant="light" loading={loading} onClick={() => void loadByGeo(unit)}>
							Геолокация
						</Button>
						<Button
							size="xs"
							variant="default"
							loading={loading}
							onClick={() => {
								if (city.trim()) {
									void loadByCity(city, unit, cities);
								} else {
									void loadByGeo(unit);
								}
							}}
						>
							Обновить
						</Button>
					</Group>
				</Stack>
			</Modal>
		</>
	);
}
