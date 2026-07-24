import { Outlet } from 'react-router-dom';

export function AuthLayout() {
	return (
		<div
			style={{
				width: '100vw',
				height: '100vh',
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
			}}
		>
			<Outlet />
		</div>
	);
}
