import { Box, Group, Text, UnstyledButton } from '@mantine/core';
import {
	IconChevronDown,
	IconChevronRight,
	IconFile,
	IconFileTypePdf,
	IconFolder,
	IconPhoto,
} from '@tabler/icons-react';
import { useState } from 'react';

import type { PkbFileTreeNode } from '@/core/api/endpoints/pkbApi';

interface VaultFileTreeProps {
	nodes: PkbFileTreeNode[];
	selectedPath: string | null;
	onSelectFile: (path: string) => void;
	onToggleFolder?: (path: string) => void;
	expandedPaths?: Set<string>;
	level?: number;
}

function fileIcon(node: PkbFileTreeNode) {
	if (node.type === 'folder') {
		return <IconFolder size={16} stroke={1.5} />;
	}
	const ext = (node.extension ?? '').toLowerCase();
	if (ext === 'pdf') {
		return <IconFileTypePdf size={16} stroke={1.5} />;
	}
	if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext)) {
		return <IconPhoto size={16} stroke={1.5} />;
	}
	return <IconFile size={16} stroke={1.5} />;
}

function VaultFileTreeNode({
	node,
	selectedPath,
	onSelectFile,
	onToggleFolder,
	expandedPaths,
	level = 0,
}: {
	node: PkbFileTreeNode;
	selectedPath: string | null;
	onSelectFile: (path: string) => void;
	onToggleFolder?: (path: string) => void;
	expandedPaths?: Set<string>;
	level?: number;
}) {
	const isFolder = node.type === 'folder';
	const isExpanded = isFolder && (expandedPaths?.has(node.path) ?? false);
	const isSelected = selectedPath === node.path;

	const handleClick = () => {
		if (isFolder) {
			onToggleFolder?.(node.path);
			return;
		}
		onSelectFile(node.path);
	};

	return (
		<Box>
			<UnstyledButton
				onClick={handleClick}
				w="100%"
				px="xs"
				py={4}
				style={{
					paddingLeft: 8 + level * 12,
					borderRadius: 4,
					background: isSelected ? 'var(--mantine-color-blue-light)' : undefined,
				}}
			>
				<Group gap={6} wrap="nowrap">
					{isFolder ? (
						isExpanded ? (
							<IconChevronDown size={14} />
						) : (
							<IconChevronRight size={14} />
						)
					) : (
						<Box w={14} />
					)}
					{fileIcon(node)}
					<Text size="sm" lineClamp={1}>
						{node.name}
					</Text>
				</Group>
			</UnstyledButton>
			{isFolder && isExpanded && node.children?.map((child) => (
				<VaultFileTreeNode
					key={child.path || child.name}
					node={child}
					selectedPath={selectedPath}
					onSelectFile={onSelectFile}
					onToggleFolder={onToggleFolder}
					expandedPaths={expandedPaths}
					level={level + 1}
				/>
			))}
		</Box>
	);
}

export function VaultFileTree({
	nodes,
	selectedPath,
	onSelectFile,
	onToggleFolder,
	expandedPaths,
	level = 0,
}: VaultFileTreeProps) {
	return (
		<Box>
			{nodes.map((node) => (
				<VaultFileTreeNode
					key={node.path || node.name}
					node={node}
					selectedPath={selectedPath}
					onSelectFile={onSelectFile}
					onToggleFolder={onToggleFolder}
					expandedPaths={expandedPaths}
					level={level}
				/>
			))}
		</Box>
	);
}
