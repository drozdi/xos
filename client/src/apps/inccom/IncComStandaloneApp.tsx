import { BrowserRouter } from 'react-router-dom';

import { AppLoader } from '@inccom/app/app-loader';
import { AppRouters } from '@inccom/app/app-routes';
import { IncComStandaloneProvider } from '@inccom/app/inccom-standalone';

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
				background: 'var(--xos-shell-bg, var(--mantine-color-body, #15171e))',
			}}
		>
			<IncComStandaloneProvider standalone>
				<BrowserRouter basename="/inccom">
					<AppLoader>
						<AppRouters />
					</AppLoader>
				</BrowserRouter>
			</IncComStandaloneProvider>
		</div>
	);
}
