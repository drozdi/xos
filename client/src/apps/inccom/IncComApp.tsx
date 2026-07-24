import { MemoryRouter } from 'react-router-dom';

import { AppLoader } from '@inccom/app/app-loader';
import { AppRouters } from '@inccom/app/app-routes';
import { IncComStandaloneProvider } from '@inccom/app/inccom-standalone';

export default function IncComApp() {
	return (
		<div
			style={{
				position: 'absolute',
				inset: 0,
				display: 'flex',
				flexDirection: 'column',
				minHeight: 0,
				overflow: 'hidden',
			}}
		>
			<IncComStandaloneProvider standalone={false}>
				<MemoryRouter initialEntries={['/accounts']}>
					<AppLoader>
						<AppRouters />
					</AppLoader>
				</MemoryRouter>
			</IncComStandaloneProvider>
		</div>
	);
}
