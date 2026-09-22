import { ActionIcon, Box, Group, Loader, Select, Stack, Text, Tooltip } from '@mantine/core';
import { IconFocusCentered, IconZoomIn, IconZoomOut } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import cytoscape from 'cytoscape';
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import CytoscapeComponent from 'react-cytoscapejs';

import { extractApiErrorMessage } from '@/core/api/apiError';
import { pkbApi } from '@/core/api/endpoints/pkbApi';
import { queryKeys } from '@/core/api/queryKeys';

const BROKEN_NODE_PREFIX = '__broken__:';

interface GraphViewProps {
	vaultId: number;
	onNavigateNote: (path: string) => void;
}

function isBrokenNodeId(id: string): boolean {
	return id.startsWith(BROKEN_NODE_PREFIX);
}

function readDocumentColorScheme(): 'light' | 'dark' {
	if (typeof document === 'undefined') {
		return 'dark';
	}
	const attr = document.documentElement.getAttribute('data-mantine-color-scheme');
	if (attr === 'light' || attr === 'dark') {
		return attr;
	}
	return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function subscribeDocumentColorScheme(onStoreChange: () => void): () => void {
	const observer = new MutationObserver(onStoreChange);
	observer.observe(document.documentElement, {
		attributes: true,
		attributeFilter: ['data-mantine-color-scheme'],
	});
	const media = window.matchMedia('(prefers-color-scheme: dark)');
	media.addEventListener('change', onStoreChange);
	return () => {
		observer.disconnect();
		media.removeEventListener('change', onStoreChange);
	};
}

function buildGraphStylesheet(isDark: boolean): cytoscape.StylesheetStyle[] {
	if (isDark) {
		return [
			{
				selector: 'node',
				style: {
					label: 'data(label)',
					'font-size': 11,
					color: '#f1f3f5',
					'text-outline-width': 2,
					'text-outline-color': '#1a1b1e',
					'text-valign': 'bottom',
					'text-margin-y': 6,
					'background-color': '#74c0fc',
					'border-width': 1,
					'border-color': '#a5d8ff',
					width: 'mapData(degree, 0, 10, 22, 52)',
					height: 'mapData(degree, 0, 10, 22, 52)',
				},
			},
			{
				selector: 'node[?broken]',
				style: {
					'background-color': '#ced4da',
					'border-style': 'dashed',
					'border-width': 2,
					'border-color': '#e9ecef',
					color: '#dee2e6',
				},
			},
			{
				selector: 'edge',
				style: {
					width: 1.5,
					'line-color': '#adb5bd',
					'target-arrow-shape': 'triangle',
					'target-arrow-color': '#adb5bd',
					'curve-style': 'bezier',
				},
			},
			{
				selector: 'edge[?broken]',
				style: {
					'line-style': 'dashed',
					'line-color': '#ff8787',
					'target-arrow-color': '#ff8787',
				},
			},
		];
	}

	return [
		{
			selector: 'node',
			style: {
				label: 'data(label)',
				'font-size': 10,
				color: '#212529',
				'text-valign': 'bottom',
				'text-margin-y': 4,
				'background-color': '#228be6',
				width: 'mapData(degree, 0, 10, 20, 50)',
				height: 'mapData(degree, 0, 10, 20, 50)',
			},
		},
		{
			selector: 'node[?broken]',
			style: {
				'background-color': '#868e96',
				'border-style': 'dashed',
				'border-width': 2,
				'border-color': '#adb5bd',
			},
		},
		{
			selector: 'edge',
			style: {
				width: 1.5,
				'line-color': '#868e96',
				'target-arrow-shape': 'triangle',
				'target-arrow-color': '#868e96',
				'curve-style': 'bezier',
			},
		},
		{
			selector: 'edge[?broken]',
			style: {
				'line-style': 'dashed',
				'line-color': '#fa5252',
				'target-arrow-color': '#fa5252',
			},
		},
	];
}

export function GraphView({ vaultId, onNavigateNote }: GraphViewProps) {
	const cyRef = useRef<cytoscape.Core | null>(null);
	const [tagFilter, setTagFilter] = useState<string | null>(null);
	const scheme = useSyncExternalStore(
		subscribeDocumentColorScheme,
		readDocumentColorScheme,
		() => 'dark' as const,
	);
	const isDark = scheme === 'dark';
	const stylesheet = useMemo(() => buildGraphStylesheet(isDark), [isDark]);

	const filterParam = tagFilter ? `tag:${tagFilter}` : undefined;

	const graphQuery = useQuery({
		queryKey: queryKeys.pkb.graph(vaultId, filterParam),
		queryFn: () => pkbApi.graph(vaultId, filterParam),
	});

	const notesQuery = useQuery({
		queryKey: queryKeys.pkb.notes(vaultId),
		queryFn: () => pkbApi.notes(vaultId),
	});

	const tagOptions = useMemo(() => {
		const tags = new Set<string>();
		for (const note of notesQuery.data?.notes ?? []) {
			for (const tag of note.tags) {
				tags.add(tag);
			}
		}
		return Array.from(tags)
			.sort((a, b) => a.localeCompare(b))
			.map((tag) => ({ value: tag, label: tag }));
	}, [notesQuery.data?.notes]);

	const elements = useMemo(() => {
		const data = graphQuery.data;
		if (!data) {
			return [];
		}

		const nodeElements = data.nodes.map((node) => ({
			data: {
				id: node.id,
				label: node.title,
				degree: node.degree,
				broken: isBrokenNodeId(node.id),
			},
		}));

		const edgeElements = data.edges.map((edge, index) => ({
			data: {
				id: `edge-${index}-${edge.source}-${edge.target}`,
				source: edge.source,
				target: edge.target,
				type: edge.type,
				broken: isBrokenNodeId(edge.target),
			},
		}));

		return [...nodeElements, ...edgeElements];
	}, [graphQuery.data]);

	const handleCyInit = useCallback(
		(cy: cytoscape.Core) => {
			cyRef.current = cy;
			cy.on('tap', 'node', (event) => {
				const nodeId = event.target.id() as string;
				if (!isBrokenNodeId(nodeId)) {
					onNavigateNote(nodeId);
				}
			});
		},
		[onNavigateNote],
	);

	useEffect(() => {
		const cy = cyRef.current;
		if (!cy || elements.length === 0) {
			return;
		}

		const layout = cy.layout({
			name: 'cose',
			animate: false,
			padding: 30,
			nodeRepulsion: 8000,
			idealEdgeLength: 80,
		});
		layout.on('layoutstop', () => {
			cy.fit(undefined, 40);
		});
		layout.run();
	}, [elements]);

	useEffect(() => {
		const cy = cyRef.current;
		if (!cy) {
			return;
		}
		cy.style().fromJson(stylesheet).update();
	}, [stylesheet]);

	const zoomBy = (factor: number) => {
		const cy = cyRef.current;
		if (!cy) {
			return;
		}
		const next = cy.zoom() * factor;
		cy.zoom({ level: Math.min(3, Math.max(0.1, next)), renderedPosition: { x: cy.width() / 2, y: cy.height() / 2 } });
	};

	const resetView = () => {
		cyRef.current?.fit(undefined, 40);
	};

	if (graphQuery.isLoading) {
		return (
			<Group justify="center" py="xl">
				<Loader size="sm" />
			</Group>
		);
	}

	if (graphQuery.isError) {
		return (
			<Text c="red" p="md" size="sm">
				{extractApiErrorMessage(graphQuery.error, 'Не удалось загрузить граф')}
			</Text>
		);
	}

	return (
		<Stack gap="xs" h="100%" p="xs">
			<Group justify="space-between" wrap="nowrap">
				<Select
					size="xs"
					clearable
					placeholder="Фильтр по тегу"
					data={tagOptions}
					value={tagFilter}
					onChange={setTagFilter}
					style={{ minWidth: 160, maxWidth: 220 }}
				/>
				<Group gap={4}>
					<Tooltip label="Приблизить">
						<ActionIcon variant="subtle" size="sm" onClick={() => zoomBy(1.25)}>
							<IconZoomIn size={16} />
						</ActionIcon>
					</Tooltip>
					<Tooltip label="Отдалить">
						<ActionIcon variant="subtle" size="sm" onClick={() => zoomBy(0.8)}>
							<IconZoomOut size={16} />
						</ActionIcon>
					</Tooltip>
					<Tooltip label="Сбросить масштаб">
						<ActionIcon variant="subtle" size="sm" onClick={resetView}>
							<IconFocusCentered size={16} />
						</ActionIcon>
					</Tooltip>
				</Group>
			</Group>

			<Box
				flex={1}
				style={{
					minHeight: 0,
					border: '1px solid var(--mantine-color-default-border)',
					borderRadius: 4,
					background: isDark ? 'var(--mantine-color-dark-7)' : 'var(--mantine-color-body)',
				}}
			>
				{elements.length === 0 ? (
					<Text c="dimmed" ta="center" py="xl" size="sm">
						Нет заметок для отображения
					</Text>
				) : (
					<CytoscapeComponent
						key={scheme}
						elements={elements}
						cy={handleCyInit}
						style={{ width: '100%', height: '100%' }}
						stylesheet={stylesheet}
						layout={{ name: 'preset' }}
					/>
				)}
			</Box>
		</Stack>
	);
}
