import { Button, Dropdown, Flex, Typography } from 'antd';
import type { MenuProps } from 'antd';
import type { MouseEvent } from 'react';

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
	return (event?: MouseEvent) => {
		event?.preventDefault();
		event?.stopPropagation();
		onAction?.();
		void item.onClick?.(ctx);
	};
}

function toAntdMenuItems({
	entries,
	context,
	onAction,
}: MenuEntriesProps): NonNullable<MenuProps['items']> {
	const result: NonNullable<MenuProps['items']> = [];

	entries.forEach((entry, index) => {
		if (isAppMenuDivider(entry)) {
			result.push({ type: 'divider', key: entry.id ?? `divider-${index}` });
			return;
		}

		if (isAppMenuSubmenu(entry)) {
			result.push({
				key: entry.id,
				label: entry.label,
				icon: entry.icon ? <>{entry.icon}</> : undefined,
				disabled: isMenuEntryDisabled(entry, context),
				children: toAntdMenuItems({
					entries: entry.items,
					context,
					onAction,
				}),
			});
			return;
		}

		if (isAppMenuAction(entry)) {
			result.push({
				key: entry.id,
				label: (
					<span style={{ display: 'inline-flex', alignItems: 'center', gap: 12, width: '100%' }}>
						<span style={{ flex: 1 }}>{entry.label}</span>
						{entry.shortcut ? (
							<Typography.Text type="secondary" style={{ fontSize: 12 }}>
								{entry.shortcut}
							</Typography.Text>
						) : null}
					</span>
				),
				icon: entry.icon ? <>{entry.icon}</> : undefined,
				disabled: isMenuEntryDisabled(entry, context),
				onClick: () => handleAction(context, entry, onAction)(),
			});
		}
	});

	return result;
}

interface AppMenuDropdownBarProps {
	entries: AppMenuEntry[];
	context: AppMenuActionContext;
}

export function AppMenuDropdownBar({ entries, context }: AppMenuDropdownBarProps) {
	const groups = entries.filter((entry) => !isAppMenuDivider(entry));

	return (
		<Flex gap={2} wrap="nowrap" align="center" style={{ height: '100%', paddingInline: 8 }}>
			{groups.map((entry) => {
				if (isAppMenuSubmenu(entry)) {
					return (
						<Dropdown
							key={entry.id}
							menu={{
								items: toAntdMenuItems({ entries: entry.items, context }),
							}}
							trigger={['click']}
						>
							<Button
								size="small"
								disabled={isMenuEntryDisabled(entry, context)}
							>
								{entry.label}
							</Button>
						</Dropdown>
					);
				}

				if (isAppMenuAction(entry)) {
					return (
						<Button
							key={entry.id}
							size="small"
							icon={entry.icon ? <>{entry.icon}</> : undefined}
							disabled={isMenuEntryDisabled(entry, context)}
							onClick={handleAction(context, entry)}
						>
							{entry.label}
						</Button>
					);
				}

				return null;
			})}
		</Flex>
	);
}

interface AppMenuToolbarProps {
	entries: AppMenuEntry[];
	context: AppMenuActionContext;
}

export function AppMenuToolbar({ entries, context }: AppMenuToolbarProps) {
	return (
		<Flex gap={4} wrap="nowrap" align="center" style={{ height: '100%', paddingInline: 8 }}>
			{entries.map((entry, index) => {
				if (isAppMenuDivider(entry)) {
					return (
						<div
							key={entry.id ?? `divider-${index}`}
							style={{
								width: 1,
								height: 20,
								marginInline: 4,
								backgroundColor: 'var(--xos-window-titlebar-border)',
							}}
						/>
					);
				}

				if (isAppMenuSubmenu(entry)) {
					return (
						<Dropdown
							key={entry.id}
							menu={{
								items: toAntdMenuItems({ entries: entry.items, context }),
							}}
							trigger={['click']}
						>
							<Button
								type="default"
								aria-label={entry.label}
								disabled={isMenuEntryDisabled(entry, context)}
								icon={
									entry.icon ? (
										<>{entry.icon}</>
									) : (
										<span style={{ fontSize: 12 }}>{entry.label.slice(0, 1)}</span>
									)
								}
							/>
						</Dropdown>
					);
				}

				if (isAppMenuAction(entry)) {
					if (entry.icon) {
						return (
							<Button
								key={entry.id}
								type="default"
								aria-label={entry.label}
								disabled={isMenuEntryDisabled(entry, context)}
								icon={<>{entry.icon}</>}
								onClick={handleAction(context, entry)}
							/>
						);
					}

					return (
						<Button
							key={entry.id}
							size="small"
							disabled={isMenuEntryDisabled(entry, context)}
							onClick={handleAction(context, entry)}
						>
							{entry.label}
						</Button>
					);
				}

				return null;
			})}
		</Flex>
	);
}
