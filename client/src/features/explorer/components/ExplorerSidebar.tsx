import { ActionIcon, Box, NavLink, ScrollArea, Stack, Text, Tooltip } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { IconLayoutSidebarLeftCollapse, IconLayoutSidebarLeftExpand } from '@tabler/icons-react';
import { useEffect, useState, type ReactNode } from 'react';

import { queryKeys } from '@/core/api/queryKeys';

import { fetchExplorerTree, type ExplorerDisk } from '../explorerApi';
import { joinExplorerDiskPath, normalizeExplorerFolderPath } from '../explorerPathUtils';

const SIDEBAR_WIDTH = 260;
const SIDEBAR_COLLAPSED_WIDTH = 40;

interface TreeNode {
	path?: string;
	name: string;
	relativePath?: string;
	type?: string;
	children?: TreeNode[];
}

interface ExplorerSidebarProps {
	disks: ExplorerDisk[];
	currentPath: string;
	onNavigate: (path: string) => void;
}

function parseDisk(path: string) {
	const match = /^([a-z0-9_-]+):\/\//i.exec(path);
	return match?.[1]?.toLowerCase() ?? 'home';
}

function nodePath(diskRoot: string, node: TreeNode): string {
	if (node.path && /^[a-z0-9_-]+:\/\//i.test(node.path)) {
		return normalizeExplorerFolderPath(node.path);
	}
	const relative = node.relativePath ?? node.name;
	return joinExplorerDiskPath(diskRoot, relative === '/' ? '' : relative);
}

function folderChildren(node: TreeNode): TreeNode[] {
	return (node.children ?? []).filter((child) => child.type === 'folder');
}

function DiskFolderTree({
	diskRoot,
	currentPath,
	onNavigate,
}: {
	diskRoot: string;
	currentPath: string;
	onNavigate: (path: string) => void;
}) {
	const [expanded, setExpanded] = useState<Record<string, boolean>>({});

	const treeQuery = useQuery({
		queryKey: queryKeys.explorer.tree(diskRoot, 2),
		queryFn: () => fetchExplorerTree(diskRoot, 2) as Promise<TreeNode>,
	});

	const toggle = (path: string) => {
		setExpanded((prev) => ({ ...prev, [path]: !prev[path] }));
	};

	const renderNode = (node: TreeNode, depth = 0): ReactNode => {
		if (node.type !== 'folder' && !(node.children?.length ?? 0)) {
			return null;
		}

		const path = nodePath(diskRoot, node);
		if (path === diskRoot && depth === 0) {
			return folderChildren(node).map((child) => renderNode(child, depth + 1));
		}

		const label = node.name === '/' ? 'Корень' : node.name;
		const children = folderChildren(node);
		const hasChildren = children.length > 0;
		const isExpanded = expanded[path] ?? false;
		const isActive = currentPath === path || (path !== diskRoot && currentPath.startsWith(path));

		return (
			<NavLink
				key={path}
				label={label}
				active={isActive}
				opened={hasChildren ? isExpanded : undefined}
				onChange={hasChildren ? () => toggle(path) : undefined}
				onClick={() => onNavigate(path)}
				childrenOffset={hasChildren ? 12 : undefined}
			>
				{hasChildren ? children.map((child) => renderNode(child, depth + 1)) : undefined}
			</NavLink>
		);
	};

	if (treeQuery.isLoading) {
		return (
			<Text size="xs" c="dimmed" pl="md">
				Загрузка…
			</Text>
		);
	}

	if (!treeQuery.data) {
		return (
			<Text size="xs" c="dimmed" pl="md">
				Пусто
			</Text>
		);
	}

	return <Stack gap={0}>{renderNode(treeQuery.data)}</Stack>;
}

export function ExplorerSidebar({ disks, currentPath, onNavigate }: ExplorerSidebarProps) {
	const activeDisk = parseDisk(currentPath);
	const [collapsed, setCollapsed] = useState(false);
	const [expandedDisks, setExpandedDisks] = useState<Record<string, boolean>>({});

	useEffect(() => {
		setExpandedDisks((prev) => ({ ...prev, [activeDisk]: true }));
	}, [activeDisk]);

	const toggleDisk = (code: string) => {
		setExpandedDisks((prev) => ({ ...prev, [code]: !prev[code] }));
	};

	if (collapsed) {
		return (
			<Box
				w={SIDEBAR_COLLAPSED_WIDTH}
				style={{
					flexShrink: 0,
					alignSelf: 'stretch',
					minHeight: 0,
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'center',
					paddingTop: 8,
					borderRight: '1px solid var(--mantine-color-default-border)',
					background: 'var(--xos-shell-sidebar, var(--mantine-color-body))',
				}}
			>
				<Tooltip label="Показать панель дисков" position="right" withArrow>
					<ActionIcon
						variant="subtle"
						aria-label="Показать панель дисков"
						onClick={() => setCollapsed(false)}
					>
						<IconLayoutSidebarLeftExpand size={18} />
					</ActionIcon>
				</Tooltip>
			</Box>
		);
	}

	return (
		<Box
			w={SIDEBAR_WIDTH}
			style={{
				flexShrink: 0,
				alignSelf: 'stretch',
				minHeight: 0,
				display: 'flex',
				flexDirection: 'column',
				overflow: 'hidden',
				borderRight: '1px solid var(--mantine-color-default-border)',
				background: 'var(--xos-shell-sidebar, var(--mantine-color-body))',
			}}
		>
			<Box
				px="xs"
				pt="xs"
				pb={4}
				style={{
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'space-between',
					gap: 8,
					flexShrink: 0,
				}}
			>
				<Text size="xs" c="dimmed" tt="uppercase">
					Диски
				</Text>
				<Tooltip label="Скрыть панель" position="bottom" withArrow>
					<ActionIcon
						variant="subtle"
						size="sm"
						aria-label="Скрыть панель дисков"
						onClick={() => setCollapsed(true)}
					>
						<IconLayoutSidebarLeftCollapse size={16} />
					</ActionIcon>
				</Tooltip>
			</Box>
			<ScrollArea style={{ flex: 1, minHeight: 0 }} type="auto" offsetScrollbars>
				<Stack gap={4} p="xs" pt={0} pr="sm">
					{disks.map((disk) => {
						const diskRoot = `${disk.code}://`;
						const isExpanded = expandedDisks[disk.code] ?? false;
						const isActive = currentPath.startsWith(diskRoot);

						return (
							<NavLink
								key={disk.code}
								label={disk.label}
								description={disk.readOnly ? `${disk.code} · только чтение` : disk.code}
								active={isActive}
								opened={isExpanded}
								onChange={() => toggleDisk(disk.code)}
								onClick={() => onNavigate(diskRoot)}
								childrenOffset={12}
							>
								{/*
								  Keep a child always so the expand chevron stays visible when collapsed.
								  Tree loads only while the disk is expanded.
								*/}
								<Box display={isExpanded ? 'block' : 'none'} aria-hidden={!isExpanded}>
									{isExpanded ? (
										<DiskFolderTree
											diskRoot={diskRoot}
											currentPath={currentPath}
											onNavigate={onNavigate}
										/>
									) : (
										<span />
									)}
								</Box>
							</NavLink>
						);
					})}
				</Stack>
			</ScrollArea>
		</Box>
	);
}
