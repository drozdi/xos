import { useStoreUserProfile } from '@inccom/entities/user';

import { Loading } from '@inccom/shared/ui';

import { Button, Group, Stack, TextInput } from '@mantine/core';

import { isEmail, isNotEmpty, useForm } from '@mantine/form';

import { Template } from '@inccom/layouts';

import { useEffect } from 'react';

import { useNavigate } from 'react-router-dom';



type PersonalFormValues = Pick<IUser, 'first_name' | 'second_name' | 'email' | 'phone'>;



export function PersonalForm() {

	const storeUserProfile = useStoreUserProfile();

	const { isLoading, userData } = storeUserProfile;

	const navigate = useNavigate();



	const form = useForm<PersonalFormValues>({

		mode: 'uncontrolled',

		initialValues: {

			first_name: '',

			second_name: '',

			email: '',

			phone: '',

		},

		validate: {

			first_name: isNotEmpty('Заполните имя'),

			second_name: isNotEmpty('Заполните фамилию'),

			email: isEmail('Введите корректный email'),

		},

	});



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

			form.setValues({

				first_name: userData.first_name ?? '',

				second_name: userData.second_name ?? '',

				email: userData.email ?? '',

				phone: userData.phone ?? '',

			});

		}

	}, [userData]);



	useEffect(() => {

		void storeUserProfile.load();

	}, []);



	return (

		<Loading active={isLoading} keepMounted>

			<Stack component="form">

				<TextInput

					label="Имя"

					placeholder="Имя"

					{...form.getInputProps('first_name')}

				/>

				<TextInput

					label="Фамилия"

					placeholder="Фамилия"

					{...form.getInputProps('second_name')}

				/>

				<TextInput

					label="Email"

					type="email"

					placeholder="Email"

					{...form.getInputProps('email')}

				/>

				<TextInput

					label="Телефон"

					placeholder="Телефон"

					{...form.getInputProps('phone')}

				/>



				<Template.Footer>

					<Group>

						<Button

							color="green"

							loading={isLoading}

							onClick={() => form.onSubmit(handleSaveNavigate)()}

						>

							Сохранить

						</Button>

						<Button

							loading={isLoading}

							onClick={() => form.onSubmit(handleSave)()}

						>

							Применить

						</Button>

					</Group>

				</Template.Footer>

			</Stack>

		</Loading>

	);

}

