import { SignInForm } from "@inccom/features/auth/sign-in-form";
import { Stack, Text, Title } from "@mantine/core";

export function SignInPage() {
	return (
		<Stack>
			<Title ta="center" order={1}>
				Авторизуйтесь
			</Title>
			<SignInForm />
			<Text>
				Прямая регистрация новых пользователей закрыта. Обратитесь к
				админастратору.
			</Text>
		</Stack>
	);
}
