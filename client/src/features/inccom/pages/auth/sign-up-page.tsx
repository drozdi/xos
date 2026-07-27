import { SignUpForm } from "@inccom/features/auth/sign-up-form";
import { Stack, Title } from "@mantine/core";

export function SignUpPage() {
	return (
		<Stack>
			<Title ta="center" order={1}>
				Регистрация
			</Title>
			<SignUpForm />
		</Stack>
	);
}
