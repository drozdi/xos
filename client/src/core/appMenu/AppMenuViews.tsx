import { ActionIcon, Box, Button, Group, Menu, Text } from '@mantine/core';
import type { MouseEvent, ReactNode } from 'react';

import type { AppMenuActionContext, AppMenuEntry } from './types';
import {
	isAppMenuAction,
	isAppMenuDivider,
	isAppMenuSubmenu,
	isMenuEntryDisabled,
} from './types';

interface MenuEntriesProps {
	entries: AppMenuEntry[];
	context: AppMenuActionContext;
	onAction?: () => void;
}

function handleAction(
	ctx: AppMenuActionContext,
	item: { onClick?: (ctx: AppMenuActionContext) => void | Promise<void> },
	onAction?: () => void,
) {
	return (event: MouseEvent<HTMLButtonElement>) => {
		event.preventDefault();
		event.stopPropagation();
		onAction?.();
		void item.onClick?.(ctx);
	};
}

function renderDropdownEntries({
	entries,
	context,
	onAction,
}: MenuEntriesProps): ReactNode {
	return entries.map((entry, index) => {
		if (isAppMenuDivider(entry)) {
			return <Menu.Divider key={entry.id ?? `divider-${index}`} />;
		}

		if (isAppMenuSubmenu(entry)) {
			return (
				<Menu
					key={entry.id}
					trigger="hover"
					position="right-start"
					offset={2}
					withinPortal
				>
					<Menu.Target>
						<Menu.Item
							leftSection={entry.icon}
							disabled={isMenuEntryDisabled(entry, context)}
						>
							{entry.label}
						</Menu.Item>
					</Menu.Target>
					<Menu.Dropdown>
						{renderDropdownEntries({
							entries: entry.items,
							context,
							onAction,
						})}
					</Menu.Dropdown>
				</Menu>
			);
		}

		if (isAppMenuAction(entry)) {
			return (
				<Menu.Item
					key={entry.id}
					leftSection={entry.icon}
					disabled={isMenuEntryDisabled(entry, context)}
					rightSection={
						entry.shortcut ? (
							<Text size="xs" c="dimmed">
								{entry.shortcut}
							</Text>
						) : undefined
					}
					onClick={handleAction(context, entry, onAction)}
				>
					{entry.label}
				</Menu.Item>
			);
		}

		return null;
	});
}

interface AppMenuDropdownBarProps {
	entries: AppMenuEntry[];
	context: AppMenuActionContext;
}

export function AppMenuDropdownBar({ entries, context }: AppMenuDropdownBarProps) {
	const groups = entries.filter((entry) => !isAppMenuDivider(entry));

	return (
		<Group gap={2} wrap="nowrap" px="xs" h="100%">
			{groups.map((entry) => {
				if (isAppMenuSubmenu(entry)) {
					return (
						<Menu key={entry.id} trigger="click" withinPortal>
							<Menu.Target>
								<Button
									variant="default"
									size="compact-xs"
									color="gray"
									disabled={isMenuEntryDisabled(entry, context)}
								>
									{entry.label}
								</Button>
							</Menu.Target>
							<Menu.Dropdown>
								{renderDropdownEntries({ entries: entry.items, context })}
							</Menu.Dropdown>
						</Menu>
					);
				}

				if (isAppMenuAction(entry)) {
					return (
						<Button
							key={entry.id}
							variant="default"
							size="compact-xs"
							color="gray"
							leftSection={entry.icon}
							disabled={isMenuEntryDisabled(entry, context)}
							onClick={handleAction(context, entry)}
						>
							{entry.label}
						</Button>
					);
				}

				return null;
			})}
		</Group>
	);
}

interface AppMenuToolbarProps {
	entries: AppMenuEntry[];
	context: AppMenuActionContext;
}

export function AppMenuToolbar({ entries, context }: AppMenuToolbarProps) {
	return (
		<Group gap={4} wrap="nowrap" px="xs" h="100%">
			{entries.map((entry, index) => {
				if (isAppMenuDivider(entry)) {
					return (
						<Box
							key={entry.id ?? `divider-${index}`}
							w={1}
							h={20}
							style={{ backgroundColor: 'var(--xos-window-titlebar-border)' }}
							mx={4}
						/>
					);
				}

				if (isAppMenuSubmenu(entry)) {
					return (
						<Menu key={entry.id} trigger="click" withinPortal>
							<Menu.Target>
								<ActionIcon
									variant="default"
									color="gray"
									aria-label={entry.label}
									disabled={isMenuEntryDisabled(entry, context)}
								>
									{entry.icon ?? <Text size="xs">{entry.label.slice(0, 1)}</Text>}
								</ActionIcon>
							</Menu.Target>
							<Menu.Dropdown>
								{renderDropdownEntries({ entries: entry.items, context })}
							</Menu.Dropdown>
						</Menu>
					);
				}

				if (isAppMenuAction(entry)) {
					if (entry.icon) {
						return (
							<ActionIcon
								key={entry.id}
								variant="default"
								color="gray"
								aria-label={entry.label}
								disabled={isMenuEntryDisabled(entry, context)}
								onClick={handleAction(context, entry)}
							>
								{entry.icon}
							</ActionIcon>
						);
					}

					return (
						<Button
							key={entry.id}
							variant="default"
							size="compact-xs"
							color="gray"
							disabled={isMenuEntryDisabled(entry, context)}
							onClick={handleAction(context, entry)}
						>
							{entry.label}
						</Button>
					);
				}

				return null;
			})}
		</Group>
	);
}
