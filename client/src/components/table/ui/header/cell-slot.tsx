import type {
	TableHeaderCellSlotProps
} from '../type';

export function TableHeaderCellSlot<T = object>({ column }: TableHeaderCellSlotProps<T>) {
	return (
		<p
			style={{
				overflow: column.ellipsis ? 'hidden' : undefined,
				textOverflow: column.ellipsis ? 'ellipsis' : undefined,
				whiteSpace: column.noWrap ? 'nowrap' : undefined,
				margin: 0,
				maxWidth: '100%',
				flex: 1,
				textAlign: column.align || 'left',
			}}
			onMouseDown={(event) => {
				event.preventDefault();
			}}
		>
			{typeof column.header === 'function' ? column.header(column) : column.header}
		</p>
	);
}