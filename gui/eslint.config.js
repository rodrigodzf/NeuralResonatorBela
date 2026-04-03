import eslint from '@eslint/js'
import { defineConfig, globalIgnores } from 'eslint/config'
// import reactHooks from 'eslint-plugin-react-hooks'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default defineConfig(
	globalIgnores(['src/BelaAPI', 'dist', 'unused']),
	{
		extends: [
			eslint.configs.all,
			// reactHooks.configs.flat.recommended,
			tseslint.configs.strictTypeChecked,
			tseslint.configs.stylisticTypeChecked,
		],
		languageOptions: {
			ecmaVersion: 'latest',
			globals: globals.browser,
			parserOptions: {
				projectService: true,
				tsconfigRootDir: import.meta.dirname,
			},
		},
		rules: {
			'@typescript-eslint/consistent-type-definitions': 'off',
			'@typescript-eslint/no-unnecessary-type-arguments': 'off',
			'@typescript-eslint/non-nullable-type-assertion-style': 'off',
			camelcase: 'off',
			'capitalized-comments': 'off',
			complexity: 'off',
			'func-style': 'off',
			'id-length': 'off',
			'max-lines': 'off',
			'max-lines-per-function': 'off',
			'max-statements': 'off',
			'new-cap': 'off',
			'no-magic-numbers': 'off',
			'no-ternary': 'off',
			'no-underscore-dangle': 'off',
			'no-void': ['error', { allowAsStatement: true }],
			'one-var': 'off',
			'sort-imports': 'off',
		},
	},
	{
		extends: [tseslint.configs.disableTypeChecked],
		files: ['**/*.js'],
	},
)
