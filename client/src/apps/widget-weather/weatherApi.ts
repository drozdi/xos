export type WeatherHour = {
	time: string;
	temperature: number;
	weatherCode: number;
	windSpeed: number;
};

export type WeatherSnapshot = {
	temperature: number;
	weatherCode: number;
	windSpeed: number;
	placeName: string;
	hourly: WeatherHour[];
};

const WMO: Record<number, string> = {
	0: 'Ясно',
	1: 'Почти ясно',
	2: 'Переменная облачность',
	3: 'Пасмурно',
	45: 'Туман',
	48: 'Изморозь',
	51: 'Морось',
	61: 'Дождь',
	63: 'Дождь',
	65: 'Сильный дождь',
	71: 'Снег',
	73: 'Снег',
	75: 'Сильный снег',
	80: 'Ливень',
	95: 'Гроза',
};

export function describeWeather(code: number): string {
	return WMO[code] ?? `Код ${code}`;
}

export async function geocodeCity(city: string): Promise<{ lat: number; lon: number; name: string } | null> {
	const url = new URL('https://geocoding-api.open-meteo.com/v1/search');
	url.searchParams.set('name', city.trim());
	url.searchParams.set('count', '1');
	url.searchParams.set('language', 'ru');
	url.searchParams.set('format', 'json');
	const res = await fetch(url);
	if (!res.ok) {
		throw new Error('Geocoding failed');
	}
	const data = (await res.json()) as {
		results?: Array<{ latitude: number; longitude: number; name: string; country?: string }>;
	};
	const first = data.results?.[0];
	if (!first) {
		return null;
	}
	return {
		lat: first.latitude,
		lon: first.longitude,
		name: first.country ? `${first.name}, ${first.country}` : first.name,
	};
}

export async function fetchWeather(lat: number, lon: number, placeName: string): Promise<WeatherSnapshot> {
	const url = new URL('https://api.open-meteo.com/v1/forecast');
	url.searchParams.set('latitude', String(lat));
	url.searchParams.set('longitude', String(lon));
	url.searchParams.set('current', 'temperature_2m,weather_code,wind_speed_10m');
	url.searchParams.set('hourly', 'temperature_2m,weather_code,wind_speed_10m');
	url.searchParams.set('forecast_days', '1');
	url.searchParams.set('timezone', 'auto');
	const res = await fetch(url);
	if (!res.ok) {
		throw new Error('Weather fetch failed');
	}
	const data = (await res.json()) as {
		current?: {
			temperature_2m?: number;
			weather_code?: number;
			wind_speed_10m?: number;
		};
		hourly?: {
			time?: string[];
			temperature_2m?: number[];
			weather_code?: number[];
			wind_speed_10m?: number[];
		};
	};

	const times = data.hourly?.time ?? [];
	const temps = data.hourly?.temperature_2m ?? [];
	const codes = data.hourly?.weather_code ?? [];
	const winds = data.hourly?.wind_speed_10m ?? [];
	const now = Date.now();
	const hourly: WeatherHour[] = [];
	for (let i = 0; i < times.length; i++) {
		const t = times[i];
		if (!t) {
			continue;
		}
		const ts = new Date(t).getTime();
		if (Number.isNaN(ts) || ts < now - 60 * 60 * 1000) {
			continue;
		}
		hourly.push({
			time: t,
			temperature: temps[i] ?? 0,
			weatherCode: codes[i] ?? 0,
			windSpeed: winds[i] ?? 0,
		});
		if (hourly.length >= 12) {
			break;
		}
	}

	return {
		temperature: data.current?.temperature_2m ?? 0,
		weatherCode: data.current?.weather_code ?? 0,
		windSpeed: data.current?.wind_speed_10m ?? 0,
		placeName,
		hourly,
	};
}

export function readCoordsFromGeolocation(): Promise<{ lat: number; lon: number }> {
	return new Promise((resolve, reject) => {
		if (!navigator.geolocation) {
			reject(new Error('Geolocation unavailable'));
			return;
		}
		navigator.geolocation.getCurrentPosition(
			(pos) =>
				resolve({
					lat: pos.coords.latitude,
					lon: pos.coords.longitude,
				}),
			(err) => reject(err),
			{ timeout: 10000 },
		);
	});
}
