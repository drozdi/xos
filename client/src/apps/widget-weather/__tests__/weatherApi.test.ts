import { describe, expect, it } from 'vitest';

import { describeWeather } from '../weatherApi';

describe('widget-weather', () => {
	it('maps known WMO codes', () => {
		expect(describeWeather(0)).toBe('Ясно');
		expect(describeWeather(61)).toBe('Дождь');
		expect(describeWeather(999)).toBe('Код 999');
	});
});
