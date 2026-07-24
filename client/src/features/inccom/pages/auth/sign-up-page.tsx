import { Flex, Typography } from 'antd';

import { SignUpForm } from '@inccom/features/auth/sign-up-form';

export function SignUpPage() {
	return (
		<Flex vertical gap={16}>
			<Typography.Title level={2} style={{ textAlign: 'center', margin: 0 }}>
				Регистрация
			</Typography.Title>
			<SignUpForm />
		</Flex>
	);
}
