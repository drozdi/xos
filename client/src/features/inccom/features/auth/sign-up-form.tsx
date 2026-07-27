import { useStoreAuth, useStoreUserProfile } from '@inccom/entities/user';

import { Button, Notification, PasswordInput, Stack, TextInput } from '@mantine/core';

import { useForm } from '@mantine/form';

import { useNavigate } from 'react-router-dom';

import type { IRegisterRequest } from '@inccom/entities/user';



export const SignUpForm = () => {

	const storeAuth = useStoreAuth();

	const storeUserProfile = useStoreUserProfile();

	const form = useForm<

		IRegisterRequest & {

			re_password?: string;

		}

	>({

		mode: 'uncontrolled',

		name: 'signUp',

		initialValues: {

			login: '',

			name: '',

			email: '',

			password: '',

			re_password: '',

		},

	});

	const { isLoading, error } = storeAuth;

	const navigate = useNavigate();



	async function sendFormData(formData: IRegisterRequest) {

		const res = await storeAuth.register(formData);

		if (res?.user) {

			storeUserProfile.setUserData(res.user);

			navigate('/analytics', { replace: true });

		}

	}



	return (

		<>

			{error && <Notification color="red">{error}</Notification>}

			<Stack component="form">

				<TextInput

					placeholder="Login"

					type="text"

					required

					{...form.getInputProps('login')}

				/>

				<TextInput

					placeholder="Имя"

					type="text"

					required

					{...form.getInputProps('name')}

				/>

				<TextInput

					placeholder="Email"

					type="email"

					required

					{...form.getInputProps('email')}

				/>

				<PasswordInput

					placeholder="Придумай пароль"

					type="password"

					required

					{...form.getInputProps('password')}

				/>

				<PasswordInput

					placeholder="Повтори пароль"

					type="password"

					required

					{...form.getInputProps('re_password')}

				/>



				<Button

					onClick={() => form.onSubmit(sendFormData)()}

					fullWidth

					loading={isLoading}

				>

					Зарегистрироваться

				</Button>

			</Stack>

		</>

	);

};

