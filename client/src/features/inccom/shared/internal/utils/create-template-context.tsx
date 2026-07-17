import { cloneElement, isValidElement, useEffect, useId, useMemo, useRef } from 'react'

import { create } from 'zustand'

type TemplateContextValue = Record<string, React.ReactNode>
type TemplateContext = {
	templates: TemplateContextValue
	register: (slotName: string, element: React.ReactNode) => void
	unregister: (slotName: string) => void
}

interface TemplateProps {
	slot: string
	children?: React.ReactNode
	[key: string]: any
}
interface TemplateSlotProps extends React.HTMLAttributes<HTMLElement> {
	name: string
	children?: React.ReactNode
}

// Выносим shallow compare для оптимизации
function shallowEqual(objA: any, objB: any): boolean {
	if (objA === objB) {
		return true
	}

	if (typeof objA !== 'object' || objA === null || typeof objB !== 'object' || objB === null) {
		return false
	}

	const keysA = Object.keys(objA)
	const keysB = Object.keys(objB)

	if (keysA.length !== keysB.length) {
		return false
	}

	for (let i = 0; i < keysA.length; i++) {
		if (objA[keysA[i]] !== objB[keysA[i]]) {
			return false
		}
	}

	return true
}

export function createTemplateContext(): [any & Record<string, any>, Function] {
	const useTemplateContext = create<TemplateContext>((set, get) => ({
		templates: {},
		register: (slotName: string, element: React.ReactNode) => {
			set({
				templates: {
					...get().templates,
					[slotName]: element,
				},
			})
		},
		unregister: (slotName: string) => {
			const { [slotName]: _, ...templates } = get().templates
			set({
				templates,
			})
		},
	}))

	function useTemplateManager() {
		const templates = useTemplateContext(state => state.templates)
		return {
			getTemplate: (slotName: string): React.ReactNode => templates[slotName],
			hasTemplate: (slotName: string): boolean => !!templates[slotName],
		}
	}

	function Template({ slot = 'default', children, ...props }: TemplateProps) {
		const manager = useTemplateContext()
		const uniqueId = useId()

		const prevSlotRef = useRef('')
		const prevPropsRef = useRef(props)

		const element = useMemo(
			() => (isValidElement(children) ? cloneElement(children, { key: uniqueId, ...props }) : children),
			[children, uniqueId]
		)

		useEffect(() => {
			// if (prevSlotRef.current !== slot || !shallowEqual(prevPropsRef.current, props)) {
			manager.register(slot, element)
			// 	prevSlotRef.current = slot
			// 	prevPropsRef.current = props
			// }

			return () => {
				//if (prevSlotRef.current === slot) {
				manager.unregister(slot)
				//}
			}
		}, [slot, element])

		return null
	}

	function TemplateSlot({ name = 'default', children, ...slotProps }: TemplateSlotProps) {
		const templates = useTemplateContext(state => state.templates)

		const template = templates[name] || children

		if (typeof template === 'function') {
			return (template as Function)(slotProps)
		}

		if (!isValidElement(template)) {
			return <>{template}</>
		}

		return cloneElement(template, { ...slotProps, key: template.key })
	}
	Template.Slot = TemplateSlot

	function TemplateHas({ name, children }: { name: string; children: React.ReactNode }) {
		const { hasTemplate } = useTemplateManager()
		return hasTemplate(name) ? children : null
	}
	Template.Has = TemplateHas

	Template.use = useTemplateContext

	return [Template, useTemplateManager]
}