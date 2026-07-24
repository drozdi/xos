import { Button } from 'antd';
import { UserOutlined } from '@ant-design/icons';
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
			icon={<UserOutlined />}
		/>
	);
}
