import { BrowserRouter } from 'react-router-dom'
import { $setting } from '../../../shared'

export function ProviderRouter({ children }: { children: React.ReactNode }) {
	return <BrowserRouter basename={$setting.get('BASE_URL')}>{children}</BrowserRouter>
}
