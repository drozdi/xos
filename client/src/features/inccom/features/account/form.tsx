import {
	defaultAccount,
	useAccountCreate,
	useAccountQuery,
	useAccountUpdate,
	useEnumsCurrency,
	useEnumsTypeAccount,
} from '@inccom/entities/account';
import { Template } from '@inccom/layouts';
import {
	Button,
	ColorInput,
	Group,
	Loader,
	NumberInput,
	Select,
	Stack,
	TextInput,
} from '@mantine/core';
import { isNotEmpty, useForm } from '@mantine/form';
import { balanceInputProps, formatBalance } from '@inccom/shared/utils/number-format';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

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

	const isSaving = createMutation.isPending || updateMutation.isPending;

	const form = useForm<IAccount>({
		initialValues: { ...defaultAccount },
		validate: {
			label: isNotEmpty('Заполните название'),
			type: isNotEmpty('Выберите тип счета'),
			currency: isNotEmpty('Выберите валюту'),
		},
	});

	useEffect(() => {
		if (account && isEdit) {
			form.setValues(account);
		}
	}, [account, isEdit]);

	async function handleSave(values: IAccount) {
		const { id: accountId, balance, ...data } = values;
		if (isEdit && id) {
			await updateMutation.mutateAsync({ id, ...data });
			return { id, ...data, balance } as IAccount;
		}
		return createMutation.mutateAsync({ ...data, balance });
	}

	async function saveAndNavigate() {
		const validation = form.validate();
		if (validation.hasErrors) {
			return;
		}
		try {
			await handleSave(form.getValues());
			navigate('/accounts');
		} catch {
			// ошибки показываются через mutation / notification в api layer
		}
	}

	async function saveOnly() {
		const validation = form.validate();
		if (validation.hasErrors) {
			return;
		}
		try {
			const saved = await handleSave(form.getValues());
			if (saved?.id) {
				form.setFieldValue('id', saved.id);
			}
		} catch {
			// handled upstream
		}
	}

	if (isEdit && isLoadingAccount) {
		return <Loader />;
	}

	return (
		<Stack>
			<TextInput
				label="Название счета"
				placeholder="Название счета"
				required
				{...form.getInputProps('label')}
			/>
			<Select
				label="Тип"
				placeholder="Выберите тип"
				allowDeselect={false}
				required
				data={types}
				{...form.getInputProps('type')}
			/>
			<Select
				label="Валюта"
				placeholder="Выберите валюту"
				allowDeselect={false}
				required
				searchable
				readOnly={isEdit}
				data={currencies}
				{...form.getInputProps('currency')}
			/>
			{isEdit ? (
				<TextInput
					label="Баланс"
					description="Стартовый капитал задаётся при создании; далее меняется через транзакции"
					readOnly
					value={formatBalance(form.values.balance)}
				/>
			) : (
				<NumberInput
					label="Стартовый капитал"
					description="Указывается один раз при создании счёта"
					placeholder="0,00"
					min={0}
					step={0.01}
					required
					{...balanceInputProps}
					{...form.getInputProps('balance')}
				/>
			)}
			<ColorInput
				label="Цвет"
				format="hex"
				swatches={[
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
				]}
				{...form.getInputProps('color')}
			/>
			<Template.Footer>
				<Group>
					<Button
						loading={isSaving}
						onClick={saveAndNavigate}
						color="green"
					>
						Сохранить
					</Button>
					<Button
						loading={isSaving}
						onClick={saveOnly}
						color="blue"
					>
						Применить
					</Button>
				</Group>
			</Template.Footer>
		</Stack>
	);
}
