import { ActionIcon } from "@mantine/core";
import { TbUserCircle } from "react-icons/tb";
import { useNavigate } from "react-router-dom";

export function PersonalLink() {
	const navigate = useNavigate();
	return (
		<ActionIcon
			onClick={() => navigate("/lk")}
			variant="default"
			aria-label="Toggle color scheme"
			size="xl"
			radius="100%"
		>
			<TbUserCircle />
		</ActionIcon>
	);
}
