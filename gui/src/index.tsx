// dependencies
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// src
import App from './components/App'

createRoot(document.getElementById('root') as NonNullable<HTMLDivElement>).render(
	<StrictMode>
		<App />
	</StrictMode>,
)
