import {
  AppShell, Paper
} from '@mantine/core';
import './App.css';
import { Layout } from './components/layout';


function App() {
  return <Layout>
    <AppShell.Aside p="md">
      <Paper h="100%">Aside Content</Paper>
    </AppShell.Aside>
    <AppShell.Main>
			<Paper h="100%">Main Content</Paper>
		</AppShell.Main>
  </Layout>
}

export default App
