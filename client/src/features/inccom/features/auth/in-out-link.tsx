import { useStoreAuth } from '@inccom/entities/user';
import { ActionIcon } from "@mantine/core";
import { TbLogin, TbLogout } from "react-icons/tb";
import { useNavigate } from "react-router-dom";

export const InOutLink = () => {
	const navigate = useNavigate();
	const storeAuth = useStoreAuth();
	return (
		<>
			{storeAuth.isAuth ? (
				<ActionIcon
					variant="default"
					aria-label="Выйти"
					size="xl"
					radius="100%"
					onClick={() => navigate("/auth/sign-out")}
					title="Выйти"
				>
					<TbLogout />
				</ActionIcon>
			) : (
				<ActionIcon
					variant="default"
					aria-label="Войти"
					size="xl"
					radius="100%"
					onClick={() => navigate("/auth/sign-in")}
					title="Войти"
				>
					<TbLogin />
				</ActionIcon>
			)}
		</>
	);
};
