import { Flex, Typography } from 'antd';

import { SignInForm } from '@inccom/features/auth/sign-in-form';

export function SignInPage() {
	return (
		<Flex vertical gap={16}>
			<Typography.Title level={2} style={{ textAlign: 'center', margin: 0 }}>
				Авторизуйтесь
			</Typography.Title>
			<SignInForm />
			<Typography.Text>
				Вход по email. Регистрация новых пользователей закрыта — обратитесь к администратору.
			</Typography.Text>
		</Flex>
	);
}
