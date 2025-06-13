import { Button, Modal, PasswordInput, TextInput, Tooltip } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useState } from 'react';

import { useAuthSystem } from '../../core/auth-system';

export const AuthForm = () => {
	const isAuth = useAuthSystem((state) => state.isAuth);
	const login = useAuthSystem((state) => state.login);

	const close = () => {};

	const [opened, setOpened] = useState(false);

	const form = useForm({
		mode: 'uncontrolled',
		initialValues: {
			login: '',
			password: '',
		},
	});

	const valid = form.values.password.length >= 6;

	return (
		<Modal opened={!isAuth} onClose={close} title="Authentication">
			<form onSubmit={form.onSubmit(login)}>
				<TextInput
					placeholder="Your login"
					key={form.key('login')}
					{...form.getInputProps('login')}
				/>
				<Tooltip
					label={
						valid
							? 'All good!'
							: 'Password must include at least 6 characters'
					}
					position="bottom-start"
					withArrow
					opened={opened}
					color={valid ? 'teal' : undefined}
					withinPortal
				>
					<PasswordInput
						label="Tooltip shown onFocus"
						required
						placeholder="Your password"
						onFocus={() => setOpened(true)}
						onBlur={() => setOpened(false)}
						mt="md"
						key={form.key('password')}
						{...form.getInputProps('password')}
					/>
				</Tooltip>
				<Button type="submit" mt="lg">
					Submit
				</Button>
			</form>
		</Modal>
	);
};
