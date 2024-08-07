import eslint from '@eslint/js'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'

export default tseslint.config(
	eslint.configs.recommended,
	...tseslint.configs.strictTypeChecked,
	...tseslint.configs.stylisticTypeChecked,
	{
		ignores: ['**/src/BelaAPI/**', '**/dist/**', '**/unused/**'],
	},
	{
		languageOptions: {
			ecmaVersion: 'latest',
			parserOptions: {
				projectService: true,
				tsconfigRootDir: import.meta.dirname,
			},
		},
		plugins: {
			'react-refresh': reactRefresh,
		},
		rules: {
			'@typescript-eslint/consistent-type-definitions': 'off',
			'@typescript-eslint/non-nullable-type-assertion-style': 'off',
		},
	},
	{
		files: ['**/*.js'],
		extends: [tseslint.configs.disableTypeChecked],
	},
)
