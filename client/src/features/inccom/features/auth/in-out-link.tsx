import { Button } from 'antd';
import { LoginOutlined, LogoutOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

import { useStoreAuth } from '@inccom/entities/user';

export const InOutLink = () => {
	const navigate = useNavigate();
	const storeAuth = useStoreAuth();
	return (
		<>
			{storeAuth.isAuth ? (
				<Button
					type="default"
					shape="circle"
					size="large"
					aria-label="Выйти"
					onClick={() => navigate('/auth/sign-out')}
					title="Выйти"
					icon={<LogoutOutlined />}
				/>
			) : (
				<Button
					type="default"
					shape="circle"
					size="large"
					aria-label="Войти"
					onClick={() => navigate('/auth/sign-in')}
					title="Войти"
					icon={<LoginOutlined />}
				/>
			)}
		</>
	);
};
