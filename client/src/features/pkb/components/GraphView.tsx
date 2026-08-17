import { ActionIcon, Box, Group, Loader, Select, Stack, Text, Tooltip } from '@mantine/core';
import { IconFocusCentered, IconZoomIn, IconZoomOut } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import cytoscape from 'cytoscape';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import CytoscapeComponent from 'react-cytoscapejs';

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

export function GraphView({ vaultId, onNavigateNote }: GraphViewProps) {
	const cyRef = useRef<cytoscape.Core | null>(null);
	const [tagFilter, setTagFilter] = useState<string | null>(null);

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
				Не удалось загрузить граф
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

			<Box flex={1} style={{ minHeight: 0, border: '1px solid var(--mantine-color-default-border)', borderRadius: 4 }}>
				{elements.length === 0 ? (
					<Text c="dimmed" ta="center" py="xl" size="sm">
						Нет заметок для отображения
					</Text>
				) : (
					<CytoscapeComponent
						elements={elements}
						cy={handleCyInit}
						style={{ width: '100%', height: '100%' }}
						stylesheet={[
							{
								selector: 'node',
								style: {
									label: 'data(label)',
									'font-size': 10,
									'text-valign': 'bottom',
									'text-margin-y': 4,
									'background-color': '#228be6',
									width: 'mapData(degree, 0, 10, 20, 50)',
									height: 'mapData(degree, 0, 10, 20, 50)',
								},
							},
							{
								selector: 'node[broken]',
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
									'line-color': '#adb5bd',
									'target-arrow-shape': 'triangle',
									'target-arrow-color': '#adb5bd',
									'curve-style': 'bezier',
								},
							},
							{
								selector: 'edge[broken]',
								style: {
									'line-style': 'dashed',
									'line-color': '#fa5252',
									'target-arrow-color': '#fa5252',
								},
							},
						]}
						layout={{ name: 'preset' }}
					/>
				)}
			</Box>
		</Stack>
	);
}
