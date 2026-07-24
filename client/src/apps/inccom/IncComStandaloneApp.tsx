import { BrowserRouter } from 'react-router-dom';

import { AppLoader } from '@inccom/app/app-loader';
import { AppRouters } from '@inccom/app/app-routes';

/** Полноэкранный IncCom на /inccom с входом по email. */
export default function IncComStandaloneApp() {
	return (
		<div
			style={{
				position: 'fixed',
				inset: 0,
				display: 'flex',
				flexDirection: 'column',
				minHeight: 0,
				overflow: 'hidden',
				background: 'var(--ant-color-bg-layout, #f5f5f5)',
			}}
		>
			<BrowserRouter basename="/inccom">
				<AppLoader>
					<AppRouters />
				</AppLoader>
			</BrowserRouter>
		</div>
	);
}
