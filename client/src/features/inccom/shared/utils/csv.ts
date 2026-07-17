import { isSafari } from './is'

function toKeys(keys: string | string[]): string[] {
	return (keys = typeof keys === 'string' ? keys.split(/\s+/) : keys)
}

function formatRow(row: Record<string, unknown>, keys: string[]): string[] {
	const _row: string[] = []
	keys.forEach(key => {
		_row.push(`${row[key]}` || '')
	})
	return _row
}

function formatTable(data: any[], keys: string[], _formatRow = formatRow): string[][] {
	const table: string[][] = []

	data.forEach(item => {
		table.push(_formatRow(item, keys))
	})

	return table
}

export function toCsv<T>(data: T[], keys: string | string[], _formatTable = formatTable): string {
	keys = toKeys(keys)
	return _formatTable(data, keys)
		.map(item => item.join(';'))
		.join('\n')
}

export function downloadCsv(csv: string, uFEFF = false, name: string = 'download') {
	const type = isSafari() ? 'application/csv' : 'text/csv'
	const blob = new Blob([uFEFF ? '\uFEFF' : '', csv], { type })
	const dataURI = `data:${type};charset=utf-8,${uFEFF ? '\uFEFF' : ''}${csv}`
	const URL = window.URL || window.webkitURL

	const a = document.createElement('a')
	a.href = typeof URL.createObjectURL === 'undefined' ? dataURI : URL.createObjectURL(blob)
	a.download = `${name}.csv`
	a.click()
}
