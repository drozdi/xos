import { Box } from '@mantine/core';
import { MemoryRouter } from 'react-router-dom';

import { AppLoader } from '@inccom/app/app-loader';
import { AppRouters } from '@inccom/app/app-routes';

export default function IncComApp() {
	return (
		<Box
			style={{
				position: 'absolute',
				inset: 0,
				display: 'flex',
				flexDirection: 'column',
				minHeight: 0,
				overflow: 'hidden',
			}}
		>
			<MemoryRouter initialEntries={['/accounts']}>
				<AppLoader>
					<AppRouters />
				</AppLoader>
			</MemoryRouter>
		</Box>
	);
}
