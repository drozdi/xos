import { ActionIcon, Group, TextInput, type TextInputProps } from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { useEffect, useState } from 'react';
import { TbSearch, TbX } from 'react-icons/tb';

export interface TableSearchProps extends Omit<TextInputProps, 'value' | 'onChange'> {
	value?: string;
	onChange?: (value: string) => void;
	debounce?: number;
}

export function TableSearch({
	value: initialValue = '',
	onChange,
	debounce = 300,
	placeholder = 'Поиск...',
	...props
}: TableSearchProps) {
	const [value, setValue] = useState(initialValue);
	const [debounced] = useDebouncedValue(value, debounce);

	useEffect(() => {
		onChange?.(debounced);
	}, [debounced, onChange]);

	const handleClear = () => {
		setValue('');
	};

	return (
		<TextInput
			placeholder={placeholder}
			value={value}
			onChange={(e) => setValue(e.currentTarget.value)}
			leftSection={<TbSearch size={16} />}
			rightSection={
				value ? (
					<ActionIcon
						variant="subtle"
						color="gray"
						onClick={handleClear}
						size="sm"
					>
						<TbX size={16} />
					</ActionIcon>
				) : null
			}
			{...props}
		/>
	);
}
