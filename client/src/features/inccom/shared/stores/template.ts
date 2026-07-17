import { create } from 'zustand'

export interface StoreTemplate {
	templates: Record<string, React.ReactNode | React.ReactElement | undefined>
	register: (slotName: string, element: React.ReactNode | React.ReactElement) => void
	unregister: (slotName: string) => void
}

export const useStoreTemplate = create<StoreTemplate>((set) => ({
	templates: {},
	register(slotName, element) {
		set(state => ({
			templates: { ...state.templates, [slotName]: element },
		}))
	},
	unregister(slotName) {
		set(state => ({
			templates: { ...state.templates, [slotName]: undefined },
		}))
	},
}))
