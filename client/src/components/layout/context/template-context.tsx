import {
	cloneElement,
	createContext,
	isValidElement,
	useContext,
	useEffect,
	useId,
	useMemo,
	useState,
} from 'react';

type TemplateManagerStateType = Record<string, any>;
type TemplateManagerContextType = {
	templates: TemplateManagerStateType;
	register: (slotName: string, element: any) => void;
	unregister: (slotName: string) => void;
};

// Создаем контекст для менеджера шаблонов
const TemplateManagerContext = createContext<TemplateManagerContextType | null>(null);

// Фабрика контекста для создания нового контекста
function factoryContext(): TemplateManagerContextType {
	// Состояние для хранения шаблонов: { [slotName]: [elements] }
	const [templates, setTemplates] = useState<TemplateManagerStateType>({});

	// Регистрация шаблона
	const register = (slotName: string, element: any) => {
		setTemplates((prev) => ({
			...prev,
			[slotName]: element,
		}));
	};

	// Удаление шаблона
	const unregister = (slotName: string) => {
		setTemplates((prev: TemplateManagerStateType): TemplateManagerStateType => {
			return {
				...prev,
				[slotName]: undefined,
			} as TemplateManagerStateType;
		});
	};

	// Значение контекста
	return useMemo<TemplateManagerContextType>(
		() => ({
			templates,
			register,
			unregister,
		}),
		[templates],
	);
}

/**
 * Провайдер для управления шаблонами
 * @param {Object} props - Свойства компонента
 * @param {React.ReactNode} props.children - Дочерние элементы
 */
export function TemplateProvider({
	children,
	value,
}: {
	children: React.ReactNode;
	value?: TemplateManagerContextType;
}) {
	const contextValue = value || factoryContext();
	return (
		<TemplateManagerContext.Provider value={contextValue}>
			{children}
		</TemplateManagerContext.Provider>
	);
}

export function Template({ slot, children }: { slot: string; children: any }) {
	const manager = useContext(TemplateManagerContext);
	const uniqueId = useId();

	useEffect(() => {
		if (manager) {
			// Регистрируем шаблон в менеджере
			manager.register(slot, cloneElement(children, { key: uniqueId }));
		}

		return () => {
			if (manager) {
				manager.unregister(slot);
			}
		};
	}, [children]);

	// Отображаем на месте, если не в контексте или не зарегистрирован
	if (!manager) {
		return children;
	}

	return null;
}

/**
 * Компонент слота для размещения шаблонов
 * @param {Object} props - Свойства компонента
 * @param {string} props.name - Имя слота
 * @param {string} props.children - Дочерние элементы
 */
export function TemplateSlot({
	name,
	children,
	...props
}: {
	name: string;
	children?: React.ReactNode;
}) {
	const manager = useContext(TemplateManagerContext);

	if (!manager) {
		console.warn('TemplateSlot используется вне TemplateProvider');
		return null;
	}

	const slotTemplates = manager.templates[name];

	const element = slotTemplates ? slotTemplates : children;

	return cloneElement(isValidElement(element) ? element : <>{element}</>, props);
}

export function TemplateHasSlot({
	name,
	children,
}: {
	children: React.ReactNode;
	name: string;
}) {
	if (useTemplateManager().isTemplates(name)) {
		return children;
	} else {
		return null;
	}
}

/**
 * Хук для получения контекста менеджера шаблонов
 * @returns {Object} Контекст для доступа к API менеджера шаблонов
 */

export function useTemplateContext() {
	return useContext(TemplateManagerContext) || factoryContext();
}

/**
 * Хук для доступа к менеджеру шаблонов
 * @returns {Object} API менеджера шаблонов
 */
export function useTemplateManager() {
	const context = useContext(TemplateManagerContext);

	if (!context) {
		throw new Error(
			'useTemplateManager должен использоваться внутри TemplateProvider',
		);
	}

	return {
		getTemplates: (slotName: string) => context.templates[slotName],
		isTemplates: (slotName: string) => !!context.templates[slotName],
	};
}
