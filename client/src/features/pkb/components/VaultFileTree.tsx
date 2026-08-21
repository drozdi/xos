import {
	ActionIcon,
	Box,
	Group,
	Menu,
	Text,
	TextInput,
	UnstyledButton,
} from '@mantine/core';
import {
	IconChevronDown,
	IconChevronRight,
	IconDots,
	IconFile,
	IconFileTypePdf,
	IconFolder,
	IconPhoto,
	IconPencil,
} from '@tabler/icons-react';
import { useEffect, useRef, useState } from 'react';

import type { PkbFileTreeNode } from '@/core/api/endpoints/pkbApi';

interface VaultFileTreeProps {
	nodes: PkbFileTreeNode[];
	selectedPath: string | null;
	onSelectFile: (path: string) => void;
	onToggleFolder?: (path: string) => void;
	expandedPaths?: Set<string>;
	level?: number;
	canEdit?: boolean;
	onRename?: (fromPath: string, toPath: string) => Promise<void> | void;
	renamingPath?: string | null;
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

function buildSiblingPath(fromPath: string, newName: string): string {
	const trimmed = newName.trim();
	const slash = fromPath.lastIndexOf('/');
	if (slash < 0) {
		return trimmed;
	}
	return `${fromPath.slice(0, slash + 1)}${trimmed}`;
}

function VaultFileTreeNode({
	node,
	selectedPath,
	onSelectFile,
	onToggleFolder,
	expandedPaths,
	level = 0,
	canEdit = false,
	onRename,
	renamingPath,
	onStartRename,
	onCancelRename,
}: {
	node: PkbFileTreeNode;
	selectedPath: string | null;
	onSelectFile: (path: string) => void;
	onToggleFolder?: (path: string) => void;
	expandedPaths?: Set<string>;
	level?: number;
	canEdit?: boolean;
	onRename?: (fromPath: string, toPath: string) => Promise<void> | void;
	renamingPath?: string | null;
	onStartRename?: (path: string) => void;
	onCancelRename?: () => void;
}) {
	const isFolder = node.type === 'folder';
	const isExpanded = isFolder && (expandedPaths?.has(node.path) ?? false);
	const isSelected = selectedPath === node.path;
	const isRenaming = renamingPath === node.path;
	const [draftName, setDraftName] = useState(node.name);
	const [saving, setSaving] = useState(false);
	const inputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		if (isRenaming) {
			setDraftName(node.name);
			requestAnimationFrame(() => {
				inputRef.current?.focus();
				inputRef.current?.select();
			});
		}
	}, [isRenaming, node.name]);

	const handleClick = () => {
		if (isRenaming) {
			return;
		}
		if (isFolder) {
			onToggleFolder?.(node.path);
			return;
		}
		onSelectFile(node.path);
	};

	const commitRename = async () => {
		const nextName = draftName.trim();
		if (!nextName || nextName === node.name || !onRename) {
			onCancelRename?.();
			return;
		}
		const toPath = buildSiblingPath(node.path, nextName);
		setSaving(true);
		try {
			await onRename(node.path, toPath);
		} finally {
			setSaving(false);
			onCancelRename?.();
		}
	};

	const indent = 8 + level * 16;

	return (
		<Box>
			<Group
				gap={0}
				wrap="nowrap"
				px="xs"
				py={2}
				style={{
					paddingLeft: indent,
					borderRadius: 4,
					background: isSelected ? 'var(--mantine-color-blue-light)' : undefined,
					borderLeft:
						level > 0 ? '1px solid var(--mantine-color-default-border)' : undefined,
					marginLeft: level > 0 ? 4 : 0,
				}}
			>
				{isRenaming ? (
					<Group gap={6} wrap="nowrap" style={{ flex: 1, minWidth: 0 }} py={2}>
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
						<TextInput
							ref={inputRef}
							size="xs"
							value={draftName}
							disabled={saving}
							onChange={(event) => setDraftName(event.currentTarget.value)}
							onClick={(event) => event.stopPropagation()}
							onKeyDown={(event) => {
								if (event.key === 'Enter') {
									event.preventDefault();
									void commitRename();
								}
								if (event.key === 'Escape') {
									event.preventDefault();
									onCancelRename?.();
								}
							}}
							onBlur={() => {
								void commitRename();
							}}
							style={{ flex: 1 }}
						/>
					</Group>
				) : (
					<>
						<UnstyledButton
							onClick={handleClick}
							onContextMenu={(event) => {
								if (!canEdit || !onStartRename) {
									return;
								}
								event.preventDefault();
								onStartRename(node.path);
							}}
							style={{ flex: 1, minWidth: 0 }}
							py={2}
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
						{canEdit && onStartRename ? (
							<Menu position="bottom-end" withinPortal shadow="sm">
								<Menu.Target>
									<ActionIcon
										variant="subtle"
										size="xs"
										aria-label="Действия"
										onClick={(event) => event.stopPropagation()}
									>
										<IconDots size={14} />
									</ActionIcon>
								</Menu.Target>
								<Menu.Dropdown>
									<Menu.Item
										leftSection={<IconPencil size={14} />}
										onClick={() => onStartRename(node.path)}
									>
										Переименовать
									</Menu.Item>
								</Menu.Dropdown>
							</Menu>
						) : null}
					</>
				)}
			</Group>
			{isFolder &&
				isExpanded &&
				node.children?.map((child) => (
					<VaultFileTreeNode
						key={child.path || child.name}
						node={child}
						selectedPath={selectedPath}
						onSelectFile={onSelectFile}
						onToggleFolder={onToggleFolder}
						expandedPaths={expandedPaths}
						level={level + 1}
						canEdit={canEdit}
						onRename={onRename}
						renamingPath={renamingPath}
						onStartRename={onStartRename}
						onCancelRename={onCancelRename}
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
	canEdit = false,
	onRename,
}: VaultFileTreeProps) {
	const [renamingPath, setRenamingPath] = useState<string | null>(null);

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
					canEdit={canEdit}
					onRename={onRename}
					renamingPath={renamingPath}
					onStartRename={setRenamingPath}
					onCancelRename={() => setRenamingPath(null)}
				/>
			))}
		</Box>
	);
}
