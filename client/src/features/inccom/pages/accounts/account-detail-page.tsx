import { Divider, Flex, Spin } from 'antd';
import { useParams } from 'react-router-dom';

import { useAccountQuery } from '@inccom/entities/account';
import { AccountForm } from '@inccom/features/account/form';
import { AccountParticipantsPanel } from '@inccom/features/account-participants';
import { Template } from '@inccom/layouts';

export function AccountDetailPage() {
	const { id } = useParams();
	const accountId = Number(id);
	const { data: account, isLoading } = useAccountQuery(accountId);

	if (isLoading) {
		return <Spin />;
	}

	return (
		<>
			<Template.Title>
				{account?.label ? `Счёт: ${account.label}` : 'Счёт'}
			</Template.Title>
			<Flex vertical gap={24}>
				<AccountForm id={accountId} />
				{account?.isMaster ? (
					<>
						<Divider />
						<AccountParticipantsPanel
							accountId={accountId}
							participants={account.participants ?? []}
						/>
					</>
				) : null}
			</Flex>
		</>
	);
}
