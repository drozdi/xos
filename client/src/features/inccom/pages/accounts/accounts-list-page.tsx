import { Template } from '@inccom/layouts';
import { AccountListWidget, BalanceSummaryWidget } from '@inccom/widgets';

export function AccountsListPage() {
	return (
		<>
			<Template.Title>Счета</Template.Title>
			<BalanceSummaryWidget />
			<AccountListWidget />
		</>
	);
}
