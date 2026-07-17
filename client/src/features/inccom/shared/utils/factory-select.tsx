import type { ComboboxItem, SelectProps } from '@mantine/core'
import { Loader, Select } from '@mantine/core'

interface Props {
	isLoading: boolean
	dataSelect: ComboboxItem[]
}

export function factorySelect(props: Props | ((...args: unknown[]) => Props), ...params: unknown[]) {
	return function SelectBuilds({ leftSection, ...other }: SelectProps = {}) {
		const { isLoading, dataSelect } = typeof props === 'function' ? props(...params) : props
		return (
			<Select
				disabled={isLoading}
				leftSection={isLoading ? <Loader size='xs' /> : leftSection}
				data={dataSelect}
				{...other}
			/>
		)
	}
}
