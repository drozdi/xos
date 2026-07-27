import eslintConfigMantine from 'eslint-config-mantine';
import tseslint from 'typescript-eslint';

export default tseslint.config(
	{ ignores: ['dist', 'node_modules'] },
	...eslintConfigMantine,
);
