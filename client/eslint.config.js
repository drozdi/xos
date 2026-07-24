import tseslint from 'typescript-eslint';

export default tseslint.config(
	{ ignores: ['dist', 'node_modules'] },
	{
		files: ['src/**/*.{ts,tsx}'],
		rules: {
			'no-restricted-imports': [
				'error',
				{
					patterns: [
						{
							group: ['@mantine/*'],
							message: 'Mantine удалён. Используйте antd — docs/MANTINE_TO_ANTD.md',
						},
					],
				},
			],
		},
	},
);
