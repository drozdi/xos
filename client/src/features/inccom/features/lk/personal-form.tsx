import { Button, Flex, Form, Input } from 'antd';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { useStoreUserProfile } from '@inccom/entities/user';
import { Template } from '@inccom/layouts';
import { Loading } from '@inccom/shared/ui';

type PersonalFormValues = Pick<IUser, 'first_name' | 'second_name' | 'email' | 'phone'>;

export function PersonalForm() {
	const storeUserProfile = useStoreUserProfile();
	const { isLoading, userData } = storeUserProfile;
	const navigate = useNavigate();
	const [form] = Form.useForm<PersonalFormValues>();

	async function handleSave(values: PersonalFormValues) {
		if (!userData) {
			return;
		}
		await storeUserProfile.update({ ...userData, ...values });
	}

	async function handleSaveNavigate(values: PersonalFormValues) {
		await handleSave(values);
		navigate('/');
	}

	useEffect(() => {
		if (userData) {
			form.setFieldsValue({
				first_name: userData.first_name ?? '',
				second_name: userData.second_name ?? '',
				email: userData.email ?? '',
				phone: userData.phone ?? '',
			});
		}
	}, [userData, form]);

	useEffect(() => {
		void storeUserProfile.load();
	}, []);

	return (
		<Loading active={isLoading} keepMounted>
			<Form form={form} layout="vertical">
				<Form.Item
					label="Имя"
					name="first_name"
					rules={[{ required: true, message: 'Заполните имя' }]}
				>
					<Input placeholder="Имя" />
				</Form.Item>
				<Form.Item
					label="Фамилия"
					name="second_name"
					rules={[{ required: true, message: 'Заполните фамилию' }]}
				>
					<Input placeholder="Фамилия" />
				</Form.Item>
				<Form.Item
					label="Email"
					name="email"
					rules={[
						{ required: true, message: 'Введите email' },
						{ type: 'email', message: 'Введите корректный email' },
					]}
				>
					<Input type="email" placeholder="Email" />
				</Form.Item>
				<Form.Item label="Телефон" name="phone">
					<Input placeholder="Телефон" />
				</Form.Item>

				<Template.Footer>
					<Flex gap={8}>
						<Button
							type="primary"
							loading={isLoading}
							onClick={() => void form.validateFields().then(handleSaveNavigate)}
						>
							Сохранить
						</Button>
						<Button
							loading={isLoading}
							onClick={() => void form.validateFields().then(handleSave)}
						>
							Применить
						</Button>
					</Flex>
				</Template.Footer>
			</Form>
		</Loading>
	);
}
