import { AccountForm } from '@inccom/features/account/form';
import { Template } from '@inccom/layouts';

export function AccountCreatePage() {
	return (
		<>
			<Template.Title>Новый счёт</Template.Title>
			<AccountForm />
		</>
	);
}
