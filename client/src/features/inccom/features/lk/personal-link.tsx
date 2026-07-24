import { Button } from 'antd';
import { TbUserCircle } from 'react-icons/tb';
import { useNavigate } from 'react-router-dom';

export function PersonalLink() {
	const navigate = useNavigate();
	return (
		<Button
			type="default"
			shape="circle"
			size="large"
			aria-label="Личный кабинет"
			onClick={() => navigate('/lk')}
			icon={<TbUserCircle />}
		/>
	);
}
