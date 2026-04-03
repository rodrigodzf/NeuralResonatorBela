import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
	build: {
		rolldownOptions: {
			output: {
				comments: {
					annotation: false,
					jsdoc: false,
					legal: false,
				},
			},
		},
		target: 'baseline-widely-available',
	},
	plugins: [react()],
})
