import { Box } from '@mantine/core';
import { QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';

import { AppLoader } from '@inccom/app/app-loader';
import { AppRouters } from '@inccom/app/app-routes';
import { queryClient } from '@inccom/shared/api/query-client';

export default function IncComApp() {
	return (
		<QueryClientProvider client={queryClient}>
			<Box h="100%" style={{ minHeight: 0, overflow: 'hidden' }}>
				<MemoryRouter initialEntries={['/accounts']}>
					<AppLoader>
						<AppRouters />
					</AppLoader>
				</MemoryRouter>
			</Box>
		</QueryClientProvider>
	);
}
