import { Alert, Button, Form, Input } from 'antd';
import { useNavigate } from 'react-router-dom';

import { useStoreAuth, useStoreUserProfile, type IRegisterRequest } from '@inccom/entities/user';

export const SignUpForm = () => {
	const storeAuth = useStoreAuth();
	const storeUserProfile = useStoreUserProfile();
	const [form] = Form.useForm<IRegisterRequest & { re_password?: string }>();
	const { isLoading, error } = storeAuth;
	const navigate = useNavigate();

	async function sendFormData(formData: IRegisterRequest & { re_password?: string }) {
		const { re_password: _, ...payload } = formData;
		const res = await storeAuth.register(payload);
		if (res?.user) {
			storeUserProfile.setUserData(res.user);
			navigate('/analytics', { replace: true });
		}
	}

	return (
		<>
			{error ? <Alert type="error" showIcon message={error} style={{ marginBottom: 16 }} /> : null}
			<Form
				form={form}
				layout="vertical"
				onFinish={(v) => void sendFormData(v)}
				initialValues={{
					login: '',
					name: '',
					email: '',
					password: '',
					re_password: '',
				}}
			>
				<Form.Item name="login" rules={[{ required: true, message: 'Введите login' }]}>
					<Input placeholder="Login" />
				</Form.Item>
				<Form.Item name="name" rules={[{ required: true, message: 'Введите имя' }]}>
					<Input placeholder="Имя" />
				</Form.Item>
				<Form.Item
					name="email"
					rules={[
						{ required: true, message: 'Введите email' },
						{ type: 'email', message: 'Некорректный email' },
					]}
				>
					<Input placeholder="Email" type="email" />
				</Form.Item>
				<Form.Item name="password" rules={[{ required: true, message: 'Введите пароль' }]}>
					<Input.Password placeholder="Придумай пароль" />
				</Form.Item>
				<Form.Item
					name="re_password"
					dependencies={['password']}
					rules={[
						{ required: true, message: 'Повторите пароль' },
						({ getFieldValue }) => ({
							validator(_, value) {
								if (!value || getFieldValue('password') === value) {
									return Promise.resolve();
								}
								return Promise.reject(new Error('Пароли не совпадают'));
							},
						}),
					]}
				>
					<Input.Password placeholder="Повтори пароль" />
				</Form.Item>
				<Button type="primary" htmlType="submit" block loading={isLoading}>
					Зарегистрироваться
				</Button>
			</Form>
		</>
	);
};
