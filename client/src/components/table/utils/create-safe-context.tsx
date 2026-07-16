import { createContext, useContext } from 'react'

/**
 * Создает безопасный контекст с обработкой ошибок.
 *
 * @param {string} errorMessage - Сообщение об ошибке, если контекст используется вне провайдера.
 * @returns {Array} Массив, содержащий Provider и useSafeContext.
 */
export function createSafeContext<T>(errorMessage?: string) {
	const Context = createContext<T | null>(null)

	const useSafeContext = (): T => {
		const ctx = useContext(Context)

		if (ctx === null && errorMessage) {
			throw new Error(errorMessage)
		}

		return ctx as T
	}

	const Provider = ({ children, value }: { value: T; children: React.ReactNode }) => (
		<Context.Provider value={value}>{children}</Context.Provider>
	)

	return [Provider, useSafeContext] as const
}
