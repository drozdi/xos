export type LatLng = { lat: number; lng: number };

export type GeoFeature =
	| { type: 'track'; name?: string; points: LatLng[] }
	| { type: 'point'; name?: string; point: LatLng };

function parseCoordPair(text: string): LatLng | null {
	const parts = text.trim().split(/[,\s]+/).filter(Boolean);
	if (parts.length < 2) {
		return null;
	}
	const lng = Number.parseFloat(parts[0]!);
	const lat = Number.parseFloat(parts[1]!);
	if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
		return null;
	}
	return { lat, lng };
}

/** DOMParser when available (browser); regex fallback for Node/tests. */
function getDoc(xml: string): Document | null {
	if (typeof DOMParser === 'undefined') {
		return null;
	}
	return new DOMParser().parseFromString(xml, 'application/xml');
}

export function parseGpx(xml: string): GeoFeature[] {
	const doc = getDoc(xml);
	if (doc) {
		const features: GeoFeature[] = [];
		doc.querySelectorAll('trk').forEach((trk, index) => {
			const name = trk.querySelector('name')?.textContent ?? `Трек ${index + 1}`;
			const points: LatLng[] = [];
			trk.querySelectorAll('trkpt').forEach((pt) => {
				const lat = Number.parseFloat(pt.getAttribute('lat') ?? '');
				const lng = Number.parseFloat(pt.getAttribute('lon') ?? '');
				if (Number.isFinite(lat) && Number.isFinite(lng)) {
					points.push({ lat, lng });
				}
			});
			if (points.length > 0) {
				features.push({ type: 'track', name, points });
			}
		});
		doc.querySelectorAll('wpt').forEach((wpt) => {
			const lat = Number.parseFloat(wpt.getAttribute('lat') ?? '');
			const lng = Number.parseFloat(wpt.getAttribute('lon') ?? '');
			if (Number.isFinite(lat) && Number.isFinite(lng)) {
				features.push({
					type: 'point',
					name: wpt.querySelector('name')?.textContent ?? undefined,
					point: { lat, lng },
				});
			}
		});
		return features;
	}

	return parseGpxRegex(xml);
}

function parseGpxRegex(xml: string): GeoFeature[] {
	const features: GeoFeature[] = [];
	const trackPoints: LatLng[] = [];
	const trkptRe = /<trkpt[^>]*\blat=["']([^"']+)["'][^>]*\blon=["']([^"']+)["'][^>]*>/gi;
	let m: RegExpExecArray | null;
	while ((m = trkptRe.exec(xml))) {
		const lat = Number.parseFloat(m[1]!);
		const lng = Number.parseFloat(m[2]!);
		if (Number.isFinite(lat) && Number.isFinite(lng)) {
			trackPoints.push({ lat, lng });
		}
	}
	if (trackPoints.length > 0) {
		const nameMatch = xml.match(/<trk[^>]*>[\s\S]*?<name>([^<]*)<\/name>/i);
		features.push({ type: 'track', name: nameMatch?.[1] ?? 'Трек', points: trackPoints });
	}
	const wptRe =
		/<wpt[^>]*\blat=["']([^"']+)["'][^>]*\blon=["']([^"']+)["'][^>]*>([\s\S]*?)<\/wpt>/gi;
	while ((m = wptRe.exec(xml))) {
		const lat = Number.parseFloat(m[1]!);
		const lng = Number.parseFloat(m[2]!);
		if (Number.isFinite(lat) && Number.isFinite(lng)) {
			const name = m[3]?.match(/<name>([^<]*)<\/name>/i)?.[1];
			features.push({ type: 'point', name, point: { lat, lng } });
		}
	}
	return features;
}

export function parseKml(xml: string): GeoFeature[] {
	const doc = getDoc(xml);
	if (doc) {
		const features: GeoFeature[] = [];
		doc.querySelectorAll('Placemark').forEach((pm, index) => {
			const name = pm.querySelector('name')?.textContent ?? `Объект ${index + 1}`;
			const lineCoords = pm.querySelector('LineString > coordinates')?.textContent;
			const pointCoords = pm.querySelector('Point > coordinates')?.textContent;
			if (lineCoords) {
				const points = lineCoords
					.trim()
					.split(/\s+/)
					.map(parseCoordPair)
					.filter((p): p is LatLng => Boolean(p));
				if (points.length > 0) {
					features.push({ type: 'track', name, points });
				}
				return;
			}
			if (pointCoords) {
				const point = parseCoordPair(pointCoords);
				if (point) {
					features.push({ type: 'point', name, point });
				}
			}
		});
		return features;
	}

	return parseKmlRegex(xml);
}

function parseKmlRegex(xml: string): GeoFeature[] {
	const features: GeoFeature[] = [];
	const placemarkRe = /<Placemark>([\s\S]*?)<\/Placemark>/gi;
	let m: RegExpExecArray | null;
	let index = 0;
	while ((m = placemarkRe.exec(xml))) {
		index += 1;
		const body = m[1] ?? '';
		const name = body.match(/<name>([^<]*)<\/name>/i)?.[1] ?? `Объект ${index}`;
		const line = body.match(/<LineString>[\s\S]*?<coordinates>([\s\S]*?)<\/coordinates>/i)?.[1];
		const pointRaw = body.match(/<Point>[\s\S]*?<coordinates>([\s\S]*?)<\/coordinates>/i)?.[1];
		if (line) {
			const points = line
				.trim()
				.split(/\s+/)
				.map(parseCoordPair)
				.filter((p): p is LatLng => Boolean(p));
			if (points.length > 0) {
				features.push({ type: 'track', name, points });
			}
			continue;
		}
		if (pointRaw) {
			const point = parseCoordPair(pointRaw);
			if (point) {
				features.push({ type: 'point', name, point });
			}
		}
	}
	return features;
}

export function parseGeoFile(path: string, content: string): GeoFeature[] {
	const ext = path.split('.').pop()?.toLowerCase();
	if (ext === 'gpx') {
		return parseGpx(content);
	}
	if (ext === 'kml') {
		return parseKml(content);
	}
	return [];
}

export function boundsOfFeatures(features: GeoFeature[]): LatLng[] {
	const points: LatLng[] = [];
	for (const f of features) {
		if (f.type === 'track') {
			points.push(...f.points);
		} else {
			points.push(f.point);
		}
	}
	return points;
}
