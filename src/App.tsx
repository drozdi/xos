import { Skeleton } from '@mantine/core';
import { Layout } from './components/layout';

function App() {
	return (
		<Layout
			navbar={
				<>
					{Array(60)
						.fill(0)
						.map((_, index) => (
							<Skeleton key={index} h={28} mt="sm" animate={false} />
						))}
				</>
			}
		></Layout>
	);
}

export default App;
