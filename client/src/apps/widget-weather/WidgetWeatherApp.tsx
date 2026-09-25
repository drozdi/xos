import { Alert, Box, Button, Group, Loader, Stack, Text, TextInput } from '@mantine/core';
import { useCallback, useEffect, useState } from 'react';

import { useWindowTitle } from '@/core/hooks/useWindowTitle';

import {
	describeWeather,
	fetchWeather,
	geocodeCity,
	readCoordsFromGeolocation,
	type WeatherSnapshot,
} from './weatherApi';

const CITY_KEY = 'xos.widget-weather.city';

export default function WidgetWeatherApp() {
	useWindowTitle('Погода');
	const [city, setCity] = useState(() => {
		try {
			return localStorage.getItem(CITY_KEY) ?? '';
		} catch {
			return '';
		}
	});
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [weather, setWeather] = useState<WeatherSnapshot | null>(null);

	const loadByCoords = useCallback(async (lat: number, lon: number, placeName: string) => {
		setLoading(true);
		setError(null);
		try {
			const snapshot = await fetchWeather(lat, lon, placeName);
			setWeather(snapshot);
		} catch {
			setError('Не удалось загрузить погоду');
		} finally {
			setLoading(false);
		}
	}, []);

	const loadByCity = useCallback(async () => {
		const trimmed = city.trim();
		if (!trimmed) {
			setError('Укажите город');
			return;
		}
		setLoading(true);
		setError(null);
		try {
			localStorage.setItem(CITY_KEY, trimmed);
			const place = await geocodeCity(trimmed);
			if (!place) {
				setError('Город не найден');
				setLoading(false);
				return;
			}
			const snapshot = await fetchWeather(place.lat, place.lon, place.name);
			setWeather(snapshot);
		} catch {
			setError('Не удалось загрузить погоду');
		} finally {
			setLoading(false);
		}
	}, [city]);

	const loadByGeo = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const coords = await readCoordsFromGeolocation();
			await loadByCoords(coords.lat, coords.lon, 'Моё местоположение');
		} catch {
			setError('Геолокация недоступна — введите город');
			setLoading(false);
		}
	}, [loadByCoords]);

	useEffect(() => {
		if (city.trim()) {
			void loadByCity();
			return;
		}
		void loadByGeo();
		// initial load once
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	return (
		<Box p="md" h="100%" style={{ overflow: 'auto' }}>
			<Stack gap="sm">
				<Group align="flex-end" wrap="nowrap">
					<TextInput
						label="Город"
						placeholder="Москва"
						value={city}
						onChange={(e) => setCity(e.currentTarget.value)}
						style={{ flex: 1 }}
						onKeyDown={(e) => {
							if (e.key === 'Enter') {
								void loadByCity();
							}
						}}
					/>
					<Button size="sm" loading={loading} onClick={() => void loadByCity()}>
						OK
					</Button>
				</Group>
				<Group gap="xs">
					<Button size="xs" variant="light" loading={loading} onClick={() => void loadByGeo()}>
						Геолокация
					</Button>
					<Button
						size="xs"
						variant="default"
						loading={loading}
						disabled={!weather}
						onClick={() => {
							if (city.trim()) {
								void loadByCity();
							} else {
								void loadByGeo();
							}
						}}
					>
						Обновить
					</Button>
				</Group>
				{error ? <Alert color="red">{error}</Alert> : null}
				{loading && !weather ? (
					<Group justify="center" py="md">
						<Loader size="sm" />
					</Group>
				) : null}
				{weather ? (
					<Stack gap={2}>
						<Text size="sm" c="dimmed">
							{weather.placeName}
						</Text>
						<Text fw={700} style={{ fontSize: 36, lineHeight: 1.1 }}>
							{Math.round(weather.temperature)}°C
						</Text>
						<Text>{describeWeather(weather.weatherCode)}</Text>
						<Text size="sm" c="dimmed">
							Ветер {Math.round(weather.windSpeed)} км/ч
						</Text>
					</Stack>
				) : null}
			</Stack>
		</Box>
	);
}
