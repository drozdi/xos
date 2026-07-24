import { Button, ColorPicker, Flex, Form, Input, InputNumber, Select, Spin } from 'antd';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import {
	defaultAccount,
	useAccountCreate,
	useAccountQuery,
	useAccountUpdate,
	useEnumsCurrency,
	useEnumsTypeAccount,
} from '@inccom/entities/account';
import { Template } from '@inccom/layouts';
import { formatBalance } from '@inccom/shared/utils/number-format';

interface AccountFormProps {
	id?: IAccount['id'];
}

export function AccountForm({ id }: AccountFormProps) {
	const isEdit = Boolean(id);
	const navigate = useNavigate();
	const { data: account, isLoading: isLoadingAccount } = useAccountQuery(id);
	const createMutation = useAccountCreate();
	const updateMutation = useAccountUpdate();
	const { dataSelect: types } = useEnumsTypeAccount();
	const { dataSelect: currencies } = useEnumsCurrency();
	const [form] = Form.useForm<IAccount>();

	const isSaving = createMutation.isPending || updateMutation.isPending;

	useEffect(() => {
		if (account && isEdit) {
			form.setFieldsValue(account);
		} else if (!isEdit) {
			form.setFieldsValue({ ...defaultAccount });
		}
	}, [account, isEdit, form]);

	async function handleSave(values: IAccount) {
		const { id: accountId, balance, ...data } = values;
		if (isEdit && id) {
			await updateMutation.mutateAsync({ id, ...data });
			return { id, ...data, balance } as IAccount;
		}
		return createMutation.mutateAsync({ ...data, balance });
	}

	async function saveAndNavigate() {
		try {
			const values = await form.validateFields();
			await handleSave(values);
			navigate('/accounts');
		} catch {
			// validation / mutation errors
		}
	}

	async function saveOnly() {
		try {
			const values = await form.validateFields();
			const saved = await handleSave(values);
			if (saved?.id) {
				form.setFieldValue('id', saved.id);
			}
		} catch {
			// handled upstream
		}
	}

	if (isEdit && isLoadingAccount) {
		return <Spin />;
	}

	return (
		<Form form={form} layout="vertical" initialValues={{ ...defaultAccount }}>
			<Form.Item
				label="Название счета"
				name="label"
				rules={[{ required: true, message: 'Заполните название' }]}
			>
				<Input placeholder="Название счета" />
			</Form.Item>
			<Form.Item
				label="Тип"
				name="type"
				rules={[{ required: true, message: 'Выберите тип счета' }]}
			>
				<Select placeholder="Выберите тип" options={types} />
			</Form.Item>
			<Form.Item
				label="Валюта"
				name="currency"
				rules={[{ required: true, message: 'Выберите валюту' }]}
			>
				<Select
					placeholder="Выберите валюту"
					showSearch
					disabled={isEdit}
					options={currencies}
				/>
			</Form.Item>
			{isEdit ? (
				<Form.Item label="Баланс">
					<Input
						readOnly
						value={formatBalance(form.getFieldValue('balance') ?? account?.balance)}
						addonAfter="Стартовый капитал задаётся при создании; далее меняется через транзакции"
					/>
				</Form.Item>
			) : (
				<Form.Item
					label="Стартовый капитал"
					name="balance"
					extra="Указывается один раз при создании счёта"
					rules={[{ required: true, message: 'Укажите баланс' }]}
				>
					<InputNumber min={0} step={0.01} style={{ width: '100%' }} placeholder="0,00" />
				</Form.Item>
			)}
			<Form.Item label="Цвет" name="color" getValueFromEvent={(c) => (typeof c === 'string' ? c : c.toHexString())}>
				<ColorPicker
					presets={[
						{
							label: 'Палитра',
							colors: [
								'#2e2e2e',
								'#868e96',
								'#fa5252',
								'#e64980',
								'#be4bdb',
								'#7950f2',
								'#4c6ef5',
								'#228be6',
								'#15aabf',
								'#12b886',
								'#40c057',
								'#82c91e',
								'#fab005',
								'#fd7e14',
							],
						},
					]}
				/>
			</Form.Item>
			<Template.Footer>
				<Flex gap={8}>
					<Button type="primary" loading={isSaving} onClick={() => void saveAndNavigate()}>
						Сохранить
					</Button>
					<Button loading={isSaving} onClick={() => void saveOnly()}>
						Применить
					</Button>
				</Flex>
			</Template.Footer>
		</Form>
	);
}
