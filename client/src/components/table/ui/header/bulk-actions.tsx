import { useMemo } from 'react';
import { useTableDataContext, useTableRowActionsContext, useTableSelectionContext } from '../../context';
import {
	buildBulkActionsContext,
	resolveVisibleBulkActions,
} from '../../utils/row-actions';
import {
	TableBulkActionsMenu,
	TableBulkActionsPanel,
} from '../row-actions/panel';

export type TableHeaderBulkActionsTarget = 'actions' | 'select';

export function useTableHeaderBulkActions(target: TableHeaderBulkActionsTarget) {
	const { nodes } = useTableDataContext();
	const { bulkActions, bulkActionsPanel, hasActionsColumn } = useTableRowActionsContext();
	const { selectedRows, selectable } = useTableSelectionContext();

	const bulkContext = useMemo(
		() => buildBulkActionsContext(nodes, selectedRows),
		[nodes, selectedRows],
	);

	const visibleBulkActions = useMemo(
		() => resolveVisibleBulkActions(bulkContext, bulkActions),
		[bulkContext, bulkActions],
	);

	const isConfigured =
		!!selectable &&
		!!bulkActions?.length &&
		visibleBulkActions.length > 0 &&
		(target === 'actions' ? hasActionsColumn : !hasActionsColumn);

	const canShow = isConfigured && selectedRows.length > 0;

	return {
		isConfigured,
		canShow,
		bulkContext,
		visibleBulkActions,
		bulkActionsPanel: bulkActionsPanel ?? TableBulkActionsPanel,
	};
}

export function TableHeaderBulkActions({
	target,
	actionsMenu,
}: {
	target: TableHeaderBulkActionsTarget;
	actionsMenu?: boolean;
}) {
	const { canShow, bulkContext, visibleBulkActions, bulkActionsPanel } =
		useTableHeaderBulkActions(target);

	if (!canShow) {
		return null;
	}

	const BulkComponent = actionsMenu ? TableBulkActionsMenu : bulkActionsPanel;

	return <BulkComponent context={bulkContext} actions={visibleBulkActions} />;
}
