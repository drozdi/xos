import { describe, expect, it } from 'vitest';

import { parseGpx, parseKml } from '../geoParse';

describe('geoParse', () => {
	it('parses GPX track and waypoint', () => {
		const xml = `<?xml version="1.0"?>
<gpx><trk><name>T</name><trkseg>
<trkpt lat="55.75" lon="37.62"></trkpt>
<trkpt lat="55.76" lon="37.63"></trkpt>
</trkseg></trk>
<wpt lat="55.74" lon="37.61"><name>A</name></wpt></gpx>`;
		const features = parseGpx(xml);
		expect(features).toHaveLength(2);
		expect(features[0]).toMatchObject({ type: 'track', name: 'T' });
		expect(features[1]).toMatchObject({ type: 'point', name: 'A' });
	});

	it('parses KML placemark line', () => {
		const xml = `<?xml version="1.0"?>
<kml><Document><Placemark><name>L</name>
<LineString><coordinates>37.62,55.75,0 37.63,55.76,0</coordinates></LineString>
</Placemark></Document></kml>`;
		const features = parseKml(xml);
		expect(features).toHaveLength(1);
		expect(features[0]?.type).toBe('track');
		if (features[0]?.type === 'track') {
			expect(features[0].points).toHaveLength(2);
		}
	});
});
