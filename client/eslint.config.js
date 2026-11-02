import eslintConfigMantine from 'eslint-config-mantine';
import reactHooks from 'eslint-plugin-react-hooks';
import tseslint from 'typescript-eslint';

export default tseslint.config(
	{ ignores: ['dist', 'node_modules'] },
	...eslintConfigMantine,
	{
		plugins: {
			'react-hooks': reactHooks,
		},
		rules: {
			'react-hooks/rules-of-hooks': 'error',
			'react-hooks/exhaustive-deps': 'warn',
			'max-lines': ['warn', { max: 800, skipBlankLines: true, skipComments: true }],
			'@typescript-eslint/no-explicit-any': 'warn',
		},
	},
);
