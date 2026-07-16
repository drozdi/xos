import { createContext, useContext } from 'react'

export function createOptionalContext<T>(initialValue: T | null = null) {
	const Context = createContext<T | null>(initialValue)

	const useOptionalContext = () => useContext(Context)

	const Provider = ({
		children,
		value,
	}: {
		value: T
		children: React.ReactNode
	}) => <Context.Provider value={value}>{children}</Context.Provider>

	return [Provider, useOptionalContext] as const
}
