import { ActionIcon, Group, Menu, Tooltip } from '@mantine/core';
import { TbDots } from 'react-icons/tb';
import type { TableBulkActionsPanelProps, TableRowActionsPanelProps } from '../../type';
import { isBulkActionDisabled, isRowActionDisabled } from '../../utils/row-actions';

export function TableRowActionsPanel<T = object>({ node, actions }: TableRowActionsPanelProps<T>) {
	if (!actions.length) {
		return null;
	}

	return (
		<Group gap={4} wrap="nowrap">
			{actions.map((action) => {
				const disabled = isRowActionDisabled(node, action);
				return (
					<Tooltip key={action.id} label={action.label} disabled={disabled}>
						<ActionIcon
							variant="subtle"
							color={action.color}
							disabled={disabled}
							aria-label={typeof action.label === 'string' ? action.label : action.id}
							onClick={(event) => {
								event.stopPropagation();
								if (!disabled) {
									action.onClick(node.data, node);
								}
							}}
						>
							{action.icon ?? action.label}
						</ActionIcon>
					</Tooltip>
				);
			})}
		</Group>
	);
}

export function TableRowActionsMenu<T = object>({ node, actions }: TableRowActionsPanelProps<T>) {
	if (!actions.length) {
		return null;
	}

	return (
		<Menu withinPortal position="bottom-end" shadow="sm">
			<Menu.Target>
				<ActionIcon
					variant="subtle"
					aria-label="Действия со строкой"
					onClick={(event) => event.stopPropagation()}
				>
					<TbDots size={16} />
				</ActionIcon>
			</Menu.Target>
			<Menu.Dropdown>
				{actions.map((action) => {
					const disabled = isRowActionDisabled(node, action);
					return (
						<Menu.Item
							key={action.id}
							color={action.color}
							disabled={disabled}
							leftSection={action.icon}
							onClick={(event) => {
								event.stopPropagation();
								if (!disabled) {
									action.onClick(node.data, node);
								}
							}}
						>
							{action.label}
						</Menu.Item>
					);
				})}
			</Menu.Dropdown>
		</Menu>
	);
}

export function TableBulkActionsPanel<T = object>({
	context,
	actions,
}: TableBulkActionsPanelProps<T>) {
	if (!actions.length) {
		return null;
	}

	return (
		<Group gap={4} wrap="nowrap">
			{actions.map((action) => {
				const disabled = isBulkActionDisabled(context, action);
				return (
					<Tooltip key={action.id} label={action.label} disabled={disabled}>
						<ActionIcon
							variant="subtle"
							color={action.color}
							disabled={disabled}
							aria-label={typeof action.label === 'string' ? action.label : action.id}
							onClick={(event) => {
								event.stopPropagation();
								if (!disabled) {
									action.onClick(context);
								}
							}}
						>
							{action.icon ?? action.label}
						</ActionIcon>
					</Tooltip>
				);
			})}
		</Group>
	);
}

export function TableBulkActionsMenu<T = object>({
	context,
	actions,
}: TableBulkActionsPanelProps<T>) {
	if (!actions.length) {
		return null;
	}

	return (
		<Menu withinPortal position="bottom-end" shadow="sm">
			<Menu.Target>
				<ActionIcon
					variant="subtle"
					aria-label="Массовые действия"
					onClick={(event) => event.stopPropagation()}
				>
					<TbDots size={16} />
				</ActionIcon>
			</Menu.Target>
			<Menu.Dropdown>
				{actions.map((action) => {
					const disabled = isBulkActionDisabled(context, action);
					return (
						<Menu.Item
							key={action.id}
							color={action.color}
							disabled={disabled}
							leftSection={action.icon}
							onClick={(event) => {
								event.stopPropagation();
								if (!disabled) {
									action.onClick(context);
								}
							}}
						>
							{action.label}
						</Menu.Item>
					);
				})}
			</Menu.Dropdown>
		</Menu>
	);
}
