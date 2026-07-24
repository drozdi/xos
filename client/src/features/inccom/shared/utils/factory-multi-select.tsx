import { Select, Spin, type SelectProps } from 'antd';

import type { SelectOption } from './factory-select';

interface Props {
	isLoading: boolean;
	dataSelect: SelectOption[];
}

export function factoryMultiSelect(
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
				mode="multiple"
				defaultValue={[]}
				disabled={isLoading}
				suffixIcon={isLoading ? <Spin size="small" /> : suffixIcon}
				options={dataSelect}
				{...other}
			/>
		);
	};
}
