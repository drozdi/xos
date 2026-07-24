import { Button, Form, Input } from 'antd';
import { useNavigate } from 'react-router-dom';

import { useStoreAuth } from '@inccom/entities/user';
import { Loading } from '@inccom/shared/ui';

export const SignInForm = (props: React.HTMLAttributes<HTMLDivElement>) => {
	const storeAuth = useStoreAuth();
	const [form] = Form.useForm<{ username: string; password: string }>();
	const { isLoading } = storeAuth;
	const navigate = useNavigate();

	const handleFinish = async (values: { username: string; password: string }) => {
		const res = await storeAuth.login(values.username, values.password);
		if (true === res) {
			navigate('/', { replace: true });
		}
	};

	return (
		<div {...props}>
			<Form form={form} layout="vertical" onFinish={(v) => void handleFinish(v)}>
				<Loading active={isLoading} keepMounted>
					<Form.Item
						label="Email"
						name="username"
						rules={[{ required: true, message: 'Введите email' }]}
					>
						<Input
							placeholder="user@example.com"
							type="email"
							autoComplete="email"
						/>
					</Form.Item>
					<Form.Item
						label="Пароль"
						name="password"
						rules={[{ required: true, message: 'Введите пароль' }]}
					>
						<Input.Password
							placeholder="Пароль"
							autoComplete="current-password"
						/>
					</Form.Item>
				</Loading>
				<Button type="primary" htmlType="submit" block loading={isLoading}>
					Войти
				</Button>
			</Form>
		</div>
	);
};
