module.exports = {
	parser: '@typescript-eslint/parser', // Use TypeScript parser
	extends: [
		'eslint:recommended',
		'plugin:@typescript-eslint/recommended', // Add TypeScript rules
	],
	plugins: ['@typescript-eslint'],
	env: {
		browser: true,
		es2021: true,
	},
	parserOptions: {
		ecmaVersion: 'latest',
		sourceType: 'module',
		project: './tsconfig.json', // Point to your tsconfig
	},
	// Add overrides for TypeScript files if needed
	overrides: [
		{
			files: ['*.ts', '*.tsx'],
			rules: {
				//'prettier/prettier': 'error',
				//'@typescript-eslint/no-unused-vars': 'warn',
			},
		},
	],
};
