import { Typography } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState, type ReactNode } from 'react';

import { queryKeys } from '@/core/api/queryKeys';

import { fetchExplorerTree, type ExplorerDisk } from '../explorerApi';

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
	if (node.path) {
		return node.path.endsWith('://') || node.path.endsWith('/') ? node.path : `${node.path}/`;
	}
	const relative = node.relativePath ?? node.name;
	if (!relative || relative === '/') {
		return diskRoot;
	}
	const disk = diskRoot.replace(/\/+$/, '');
	return `${disk}/${relative}/`;
}

function TreeLink({
	label,
	description,
	active,
	opened,
	onToggle,
	onNavigate,
	children,
}: {
	label: string;
	description?: string;
	active?: boolean;
	opened?: boolean;
	onToggle?: () => void;
	onNavigate: () => void;
	children?: ReactNode;
}) {
	return (
		<div>
			<button
				type="button"
				onClick={onNavigate}
				style={{
					display: 'flex',
					width: '100%',
					alignItems: 'center',
					gap: 6,
					padding: '6px 8px',
					border: 'none',
					borderRadius: 6,
					background: active ? 'rgba(22, 119, 255, 0.12)' : 'transparent',
					color: 'var(--xos-shell-text)',
					cursor: 'pointer',
					textAlign: 'left',
				}}
			>
				{onToggle ? (
					<span
						role="button"
						tabIndex={0}
						onClick={(event) => {
							event.stopPropagation();
							onToggle();
						}}
						onKeyDown={(event) => {
							if (event.key === 'Enter' || event.key === ' ') {
								event.preventDefault();
								event.stopPropagation();
								onToggle();
							}
						}}
						style={{ width: 14, flexShrink: 0 }}
					>
						{opened ? '▾' : '▸'}
					</span>
				) : (
					<span style={{ width: 14, flexShrink: 0 }} />
				)}
				<span style={{ minWidth: 0, flex: 1 }}>
					<div style={{ fontSize: 13, fontWeight: active ? 600 : 400 }}>{label}</div>
					{description ? (
						<div style={{ fontSize: 11, opacity: 0.65 }}>{description}</div>
					) : null}
				</span>
			</button>
			{opened && children ? <div style={{ paddingLeft: 12 }}>{children}</div> : null}
		</div>
	);
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
			return (node.children ?? [])
				.filter((child) => child.type === 'folder')
				.map((child) => renderNode(child, depth + 1));
		}

		const label = node.name === '/' ? 'Корень' : node.name;
		const isExpanded = expanded[path] ?? false;
		const isActive = currentPath === path || (path !== diskRoot && currentPath.startsWith(path));
		const childFolders = (node.children ?? []).filter((child) => child.type === 'folder');

		return (
			<TreeLink
				key={path}
				label={label}
				active={isActive}
				opened={isExpanded}
				onToggle={childFolders.length > 0 ? () => toggle(path) : undefined}
				onNavigate={() => onNavigate(path)}
			>
				{childFolders.map((child) => renderNode(child, depth + 1))}
			</TreeLink>
		);
	};

	if (treeQuery.isLoading) {
		return (
			<Typography.Text type="secondary" style={{ fontSize: 12, paddingLeft: 16 }}>
				Загрузка…
			</Typography.Text>
		);
	}

	if (!treeQuery.data) {
		return (
			<Typography.Text type="secondary" style={{ fontSize: 12, paddingLeft: 16 }}>
				Пусто
			</Typography.Text>
		);
	}

	return <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>{renderNode(treeQuery.data)}</div>;
}

export function ExplorerSidebar({ disks, currentPath, onNavigate }: ExplorerSidebarProps) {
	const activeDisk = parseDisk(currentPath);
	const [expandedDisks, setExpandedDisks] = useState<Record<string, boolean>>({});

	useEffect(() => {
		setExpandedDisks((prev) => ({ ...prev, [activeDisk]: true }));
	}, [activeDisk]);

	const toggleDisk = (code: string) => {
		setExpandedDisks((prev) => ({ ...prev, [code]: !prev[code] }));
	};

	return (
		<div
			style={{
				width: 260,
				flexShrink: 0,
				alignSelf: 'stretch',
				minHeight: 0,
				display: 'flex',
				flexDirection: 'column',
				overflow: 'hidden',
				borderRight: '1px solid var(--xos-shell-border)',
			}}
		>
			<div style={{ flex: 1, minHeight: 0, overflow: 'auto', padding: 8 }}>
				<Typography.Text
					type="secondary"
					style={{ fontSize: 11, textTransform: 'uppercase', display: 'block', marginBottom: 4 }}
				>
					Диски
				</Typography.Text>
				{disks.map((disk) => {
					const diskRoot = `${disk.code}://`;
					const isExpanded = expandedDisks[disk.code] ?? false;
					const isActive = currentPath.startsWith(diskRoot);

					return (
						<TreeLink
							key={disk.code}
							label={disk.label}
							description={disk.readOnly ? `${disk.code} · только чтение` : disk.code}
							active={isActive}
							opened={isExpanded}
							onToggle={() => toggleDisk(disk.code)}
							onNavigate={() => onNavigate(diskRoot)}
						>
							{isExpanded ? (
								<DiskFolderTree
									diskRoot={diskRoot}
									currentPath={currentPath}
									onNavigate={onNavigate}
								/>
							) : null}
						</TreeLink>
					);
				})}
			</div>
		</div>
	);
}
