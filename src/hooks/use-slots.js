import {
	cloneElement,
	Fragment,
	createElement as h,
	isValidElement,
	useCallback,
	useMemo,
} from 'react'
useCallback

import { isArray, isFunction, isString } from '../utils/is'

/**
 * Хук useSlots возвращает объект с функциями для работы со слотами.
 * @param {React.ReactNode} children - Дочерние элементы.
 * @returns {Object} - Объект с функциями для работы со слотами.
 */
export function useSlots(children) {
	const slots = useMemo(() => {
		let tmpChildren = children

		if (children?.type === Fragment) {
			tmpChildren = children.props.children
		}

		tmpChildren = isArray(tmpChildren) ? tmpChildren : [tmpChildren]
		const collect = {
			default: [],
		}

		function addCollect(slotName, child) {
			if (!collect[slotName]) {
				collect[slotName] = []
			}
			collect[slotName].push(child)
		}

		for (const child of tmpChildren) {
			if (isValidElement(child)) {
				addCollect(child?.props?.slot || 'default', child)
			} else if (isString(child)) {
				addCollect('default', child)
			} else {
				for (const name in child) {
					addCollect(name, child[name])
				}
			}
		}

		return collect
	}, [children])

	/**
	 * Рендерит слот с указанным именем.
	 * Если слот пуст, использует defaultChildren.
	 */
	const slot = useCallback(
		(name = '', defaultChildren = [], ...args) => {
			name ||= 'default'
			const children =
				slots[name] ??
				(isArray(defaultChildren) ? defaultChildren : [defaultChildren])

			function genSlot(child, ...args) {
				if (isValidElement(child)) {
					return child
				} else if (isFunction(child)) {
					return child(...args)
				} else {
					return child
				}
			}

			if (children.length > 1) {
				return h(
					Fragment,
					{},
					children.map(child => {
						return genSlot(child, ...args)
					})
				)
			}
			return genSlot(children[0], ...args)
		},
		[slots]
	)

	/**
	 * Проверяет, существует ли слот и содержит ли он элементы.
	 */
	const hasSlot = useCallback(
		slotName => slots.hasOwnProperty(slotName) && slots[slotName].length > 0,
		[slots]
	)

	/**
	 * Оборачивает элемент в указанный компонент, если он еще не обернут.
	 */
	const wrapSlot = useCallback(
		(slot, component, props = {}) => {
			if (slot.type === component) {
				return cloneElement(slot, props)
			}
			return h(component, props, slot)
		},
		[slots]
	)

	return { slot, hasSlot, wrapSlot, slots }
}
