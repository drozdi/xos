import { Select, Spin, type SelectProps } from 'antd';

export type SelectOption = { value: string; label: string };

interface Props {
	isLoading: boolean;
	dataSelect: SelectOption[];
}

export function factorySelect(
	props: Props | ((...args: unknown[]) => Props),
	...params: unknown[]
) {
	return function SelectBuilds({
		suffixIcon,
		...other
	}: SelectProps = {}) {
		const { isLoading, dataSelect } =
			typeof props === 'function' ? props(...params) : props;
		return (
			<Select
				disabled={isLoading}
				suffixIcon={isLoading ? <Spin size="small" /> : suffixIcon}
				options={dataSelect}
				{...other}
			/>
		);
	};
}
