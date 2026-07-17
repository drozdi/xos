import { ActionIcon, Box, Button, Group, Select } from "@mantine/core";
import { usePagination } from "@mantine/hooks";
import { useCallback } from "react";
import { IconChevronsLeft, IconChevronsRight } from '@tabler/icons-react';
import type { TablePaginationProps } from './type';

export function TablePagination<T = object>({ 
	page, limit, limits = [15, 30, 50, 75, 100], total,
	loading, activePprevious, activeNext,
	onNext, onPprevious, onChangeLimit, onChangePage,
	nextLabel= 'Следующая', previousLabel= 'Предыдущая', ...props 
}: TablePaginationProps<T>) {
	const isCursorMode = Boolean(onNext && onPprevious);
	const showPageNumbers = !isCursorMode && total > 1;

	const pagination = usePagination({
		total: total,
		page: typeof page === 'number' ? page : undefined,
		initialPage: typeof page === 'number' ? page : 1,
		siblings: 1,
		boundaries: 1,
		onChange: onChangePage,
	})
	
	const handlePprevious = useCallback(() => {
		(onPprevious || pagination.previous)()
	}, [onPprevious, pagination.previous])

	const handleNext = useCallback(() => {
		(onNext || pagination.next)()
	}, [onNext, pagination.next])

	const disabledPrevious = isCursorMode
		? !activePprevious
		: pagination.active === 1;
	const disabledNext = isCursorMode
		? !activeNext
		: pagination.active === total;

	return <Box w='100%' {...props}>
		<Group justify="space-between" align="start">
			<Group flex='1'>
				{showPageNumbers && <ActionIcon loading={loading} variant="default" onClick={pagination.first} disabled={pagination.active === 1}>
					<IconChevronsLeft size={16} />
				</ActionIcon>}
				<Button size="compact-md" loading={loading} variant="default" onClick={handlePprevious} disabled={disabledPrevious}>
					{previousLabel}
				</Button>
				{showPageNumbers && pagination.range.map((pageNum, index) =>
					pageNum === 'dots' ? (
						<span key={index}>...</span>
					) : (
						<ActionIcon 
							loading={loading}
							key={index}
							onClick={() => pagination.setPage(pageNum)}
							variant={pagination.active === pageNum ? 'filled' : 'default'}
						>
							{pageNum}
						</ActionIcon>
					)
				)}
				<Button size="compact-md" loading={loading} variant="default" onClick={handleNext} disabled={disabledNext}>
					{nextLabel}
				</Button>
				{showPageNumbers && <ActionIcon loading={loading} variant="default" onClick={pagination.last} disabled={pagination.active === total}>
					<IconChevronsRight size={16} />
				</ActionIcon>}
			</Group>
			<Box flex='0'>
				<Select
					size="xs"
					w='4rem'
					loading={loading}
					value={String(limit)}
					allowDeselect={false}
					data={limits.map((n) => String(n))}
					onChange={(value) => onChangeLimit?.(Number(value))}
				/>
			</Box>
		</Group>
	</Box>
}
