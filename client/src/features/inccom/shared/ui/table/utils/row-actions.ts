import type { TableBulkAction, TableBulkActionsContext, TableNode, TableRowAction } from '../type';

export function resolveVisibleActions<T>(
	node: TableNode<T>,
	actions: TableRowAction<T>[] | undefined,
): TableRowAction<T>[] {
	if (!actions?.length) {
		return [];
	}
	return actions.filter((action) => {
		if (typeof action.hidden === 'function') {
			return !action.hidden(node);
		}
		return !action.hidden;
	});
}

export function isRowActionDisabled<T>(node: TableNode<T>, action: TableRowAction<T>): boolean {
	if (typeof action.disabled === 'function') {
		return action.disabled(node);
	}
	return !!action.disabled;
}

export function resolveVisibleBulkActions<T>(
	context: TableBulkActionsContext<T>,
	actions: TableBulkAction<T>[] | undefined,
): TableBulkAction<T>[] {
	if (!actions?.length) {
		return [];
	}
	return actions.filter((action) => {
		if (typeof action.hidden === 'function') {
			return !action.hidden(context);
		}
		return !action.hidden;
	});
}

export function isBulkActionDisabled<T>(
	context: TableBulkActionsContext<T>,
	action: TableBulkAction<T>,
): boolean {
	if (typeof action.disabled === 'function') {
		return action.disabled(context);
	}
	return !!action.disabled;
}

export function buildBulkActionsContext<T>(
	nodes: TableNode<T>[],
	selectedIndexes: TableNode<T>['index'][],
): TableBulkActionsContext<T> {
	const selectedSet = new Set(selectedIndexes);
	const selectedNodes = nodes.filter((node) => selectedSet.has(node.index));
	return {
		items: selectedNodes.map((node) => node.data),
		nodes: selectedNodes,
		selectedIndexes,
	};
}
