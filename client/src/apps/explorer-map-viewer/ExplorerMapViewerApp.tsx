import { Box, Center, Loader, Text } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import L from 'leaflet';
import { useEffect, useRef } from 'react';

import { useWindowTitle } from '@/core/hooks/useWindowTitle';
import { getExplorerFileName } from '@/features/explorer/explorerPathUtils';
import { fetchExplorerText } from '@/features/explorer/useExplorerOpenFile';
import { useExplorerSatelliteFile } from '@/features/explorer/useExplorerSatelliteFile';

import { boundsOfFeatures, parseGeoFile } from './geoParse';

import 'leaflet/dist/leaflet.css';

export default function ExplorerMapViewerApp() {
	const { currentPath, openFile } = useExplorerSatelliteFile({
		appId: 'explorer-map-viewer',
		fileTypes: ['geo'],
		extensions: ['gpx', 'kml'],
	});
	const mapRef = useRef<HTMLDivElement>(null);
	const mapInstance = useRef<L.Map | null>(null);

	useWindowTitle(currentPath ? getExplorerFileName(currentPath) : 'Карта');

	useEffect(() => {
		const onKey = (e: KeyboardEvent) => {
			if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'o') {
				e.preventDefault();
				void openFile();
			}
		};
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	}, [openFile]);

	const contentQuery = useQuery({
		queryKey: ['explorer', 'geo', currentPath ?? ''],
		queryFn: () => fetchExplorerText(currentPath!),
		enabled: Boolean(currentPath),
	});

	useEffect(() => {
		if (!mapRef.current) {
			return;
		}
		if (mapInstance.current) {
			return;
		}
		const map = L.map(mapRef.current).setView([55.75, 37.62], 5);
		L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
			attribution: '&copy; OpenStreetMap',
			maxZoom: 19,
		}).addTo(map);
		mapInstance.current = map;
		return () => {
			map.remove();
			mapInstance.current = null;
		};
	}, []);

	useEffect(() => {
		const map = mapInstance.current;
		if (!map || !currentPath || !contentQuery.data) {
			return;
		}

		const layer = L.layerGroup().addTo(map);
		const features = parseGeoFile(currentPath, contentQuery.data);
		for (const feature of features) {
			if (feature.type === 'track') {
				L.polyline(
					feature.points.map((p) => [p.lat, p.lng] as [number, number]),
					{ color: '#228be6', weight: 3 },
				)
					.bindPopup(feature.name ?? 'Трек')
					.addTo(layer);
			} else {
				L.circleMarker([feature.point.lat, feature.point.lng], {
					radius: 6,
					color: '#e03131',
					fillColor: '#fa5252',
					fillOpacity: 0.9,
				})
					.bindPopup(feature.name ?? 'Точка')
					.addTo(layer);
			}
		}

		const bounds = boundsOfFeatures(features);
		if (bounds.length > 0) {
			map.fitBounds(
				L.latLngBounds(bounds.map((p) => [p.lat, p.lng] as [number, number])),
				{ padding: [24, 24] },
			);
		}

		requestAnimationFrame(() => map.invalidateSize());

		return () => {
			map.removeLayer(layer);
		};
	}, [contentQuery.data, currentPath]);

	useEffect(() => {
		requestAnimationFrame(() => mapInstance.current?.invalidateSize());
	}, [currentPath]);

	return (
		<Box h="100%" style={{ position: 'relative', minHeight: 0 }}>
			<div ref={mapRef} style={{ position: 'absolute', inset: 0 }} />
			{!currentPath ? (
				<Center
					style={{
						position: 'absolute',
						inset: 0,
						pointerEvents: 'none',
						background: 'rgba(255,255,255,0.55)',
					}}
				>
					<Text>Файл → Открыть GPX/KML…</Text>
				</Center>
			) : null}
			{currentPath && contentQuery.isLoading ? (
				<Center style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
					<Loader size="sm" />
				</Center>
			) : null}
			{currentPath && contentQuery.isError ? (
				<Center style={{ position: 'absolute', inset: 0 }}>
					<Text c="red">Не удалось загрузить файл</Text>
				</Center>
			) : null}
		</Box>
	);
}
