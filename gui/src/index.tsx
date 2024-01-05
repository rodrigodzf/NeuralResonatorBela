// dependencies
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// src
import App from './components/App'

const root = document.getElementById('root')
root &&
	createRoot(root).render(
		<StrictMode>
			<App />
		</StrictMode>,
	)
