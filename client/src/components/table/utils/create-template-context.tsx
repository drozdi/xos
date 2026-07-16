import {
	cloneElement,
	isValidElement,
	useCallback,
	useDebugValue,
	useEffect,
	useId,
	useMemo,
	useRef,
	useSyncExternalStore,
} from 'react'

type TState = Record<string, React.ReactNode>

interface TemplateProps {
	slot: string
	children?: React.ReactNode
	[key: string]: any
}
interface TemplateSlotProps extends React.HTMLAttributes<HTMLElement> {
	name: string
	children?: React.ReactNode
}

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
	const listeners: Set<(state: TState) => void> = new Set()
	let templates: TState = {}

	function getTemplates(): TState {
		return templates
	}
	function getTemplatesInitial(): TState {
		return {}
	}

	function useStore(): TState {
		const slice = useSyncExternalStore(
			useCallback(listener => {
				listeners.add(listener)
				return () => listeners.delete(listener)
			}, []),
			getTemplates,
			getTemplatesInitial
		)
		useDebugValue(slice)
		return slice
	}
	const setState = useCallback((state: TState) => {
		let hasChanges = false
		const newTemplates = { ...templates }

		for (const key in state) {
			if (newTemplates[key] !== state[key]) {
				newTemplates[key] = state[key]
				hasChanges = true
			}
		}

		if (!hasChanges) {
			return
		}

		templates = newTemplates
		listeners.forEach(listener => listener(templates))
	}, [])
	function register(slotName: string, element: React.ReactNode): void {
		if (templates[slotName] === element) {
			return
		}
		setState({
			[slotName]: element,
		})
	}
	function unregister(slotName: string): void {
		if (!(slotName in templates)) {
			return
		}
		setState({
			[slotName]: undefined,
		})
	}

	function useTemplateManager() {
		const templates = useStore()

		return useMemo(
			() => ({
				getTemplate: (slotName: string): React.ReactNode => templates[slotName],
				hasTemplate: (slotName: string): boolean => !!templates[slotName],
				register,
				unregister,
			}),
			[templates]
		)
	}

	function Template({ slot = 'default', children, ...props }: TemplateProps) {
		const templates = useStore()
		const uniqueId = useId()

		const prevSlotRef = useRef(slot)
		const prevPropsRef = useRef(props)

		const element = useMemo(
			() => (isValidElement(children) ? cloneElement(children, { key: uniqueId, ...props }) : children),
			[children, uniqueId, props]
		)

		useEffect(() => {
			register(slot, element)
			prevSlotRef.current = slot
			prevPropsRef.current = props

			return () => {
				unregister(slot)
			}
		}, [slot, element])

		return null
	}

	function TemplateSlot({ name = 'default', children, ...slotProps }: TemplateSlotProps) {
		const templates = useStore()

		return useMemo(() => {
			const template = templates[name] || children

			if (typeof template === 'function') {
				return (template as Function)(slotProps)
			}

			if (!isValidElement(template)) {
				return <>{template}</>
			}

			return cloneElement(template, { ...slotProps, key: template.key })
		}, [templates[name], children, JSON.stringify(slotProps)]) // Оптимизация: мемоизация результата
	}
	Template.Slot = TemplateSlot

	function TemplateHas({ name, children }: { name: string; children: React.ReactNode }) {
		const { hasTemplate } = useTemplateManager()
		return hasTemplate(name) ? children : null
	}
	Template.Has = TemplateHas

	return [Template, useTemplateManager]
}
