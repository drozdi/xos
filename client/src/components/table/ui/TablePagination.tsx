import { ActionIcon, Box, Button, Group, Select } from "@mantine/core";
import { usePagination } from "@mantine/hooks";
import { useCallback } from "react";
import { TbChevronsLeft, TbChevronsRight } from "react-icons/tb";
import type { TablePaginationProps } from './type';

export function TablePagination<T = object>({ 
	page, limit, limits = [15, 30, 50, 75, 100], total,
	loading, activePprevious, activeNext,
	onNext, onPprevious, onChangeLimit, onChangePage,
	nextLabel= 'Следующая', previousLabel= 'Предыдущая', ...props 
}: TablePaginationProps<T>) {
	const showedSibling = onNext && onPprevious
	const showed = !(showedSibling) && total > 1

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

	const disabledPrevious = (showed && pagination.active === 1) || (!showed && !activePprevious)
	const disabledNext = (showed && pagination.active === total) || (!showed && !activeNext)

	return <Box w='100%' {...props}>
		<Group justify="space-between" align="start">
			<Group flex='1'>
				{showed && <ActionIcon loading={loading} variant="default" onClick={pagination.first} disabled={pagination.active === 1}>
					<TbChevronsLeft />
				</ActionIcon>}
				{(showed || showedSibling) && <Button size="compact-md" loading={loading} variant="default" onClick={handlePprevious} disabled={disabledPrevious}>
					{previousLabel}
				</Button>}
				{showed && pagination.range.map((pageNum, index) =>
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
				{(showed || showedSibling) && <Button size="compact-md" loading={loading} variant="default" onClick={handleNext} disabled={disabledNext}>
					{nextLabel}
				</Button>}
				{showed && <ActionIcon loading={loading} variant="default" onClick={pagination.last} disabled={pagination.active === total}>
					<TbChevronsRight />
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
