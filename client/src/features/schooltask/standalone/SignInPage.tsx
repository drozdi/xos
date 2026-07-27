import { Button, Form, Input, Flex, Typography } from 'antd';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { schooltaskEmailLogin } from './authApi';

export function SchooltaskSignInPage() {
	const navigate = useNavigate();
	const [loading, setLoading] = useState(false);
	const [form] = Form.useForm<{ username: string; password: string }>();

	const handleFinish = async (values: { username: string; password: string }) => {
		setLoading(true);
		try {
			const ok = await schooltaskEmailLogin(values.username, values.password);
			if (ok) {
				navigate('/', { replace: true });
			}
		} finally {
			setLoading(false);
		}
	};

	return (
		<Flex
			vertical
			align="center"
			justify="center"
			style={{ height: '100%', minHeight: '100vh', padding: 24 }}
		>
			<Flex vertical gap={16} style={{ width: '100%', maxWidth: 360 }}>
				<Typography.Title level={2} style={{ textAlign: 'center', margin: 0 }}>
					Авторизуйтесь
				</Typography.Title>
				<Typography.Text type="secondary" style={{ textAlign: 'center' }}>
					Школа — вход по email
				</Typography.Text>
				<Form form={form} layout="vertical" onFinish={(v) => void handleFinish(v)}>
					<Form.Item
						label="Email"
						name="username"
						rules={[{ required: true, message: 'Введите email' }]}
					>
						<Input type="email" autoComplete="email" placeholder="user@example.com" />
					</Form.Item>
					<Form.Item
						label="Пароль"
						name="password"
						rules={[{ required: true, message: 'Введите пароль' }]}
					>
						<Input.Password autoComplete="current-password" placeholder="Пароль" />
					</Form.Item>
					<Button type="primary" htmlType="submit" block loading={loading}>
						Войти
					</Button>
				</Form>
			</Flex>
		</Flex>
	);
}
