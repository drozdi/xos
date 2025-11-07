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

type TemplateStateValue = Record<string, any>;
type TemplateContextValue = {
	templates: TemplateStateValue;
	register: (slotName: string, element: any) => void;
	unregister: (slotName: string) => void;
};
interface TemplateProviderProps {
	children: React.ReactNode;
	value?: TemplateContextValue;
}
interface TemplateProps {
	slot?: string;
	children: React.ReactNode;
	[key: string]: any;
}
interface TemplateSlotProps extends React.HTMLAttributes<HTMLElement> {
	name: string;
	children?: React.ReactNode;
}

export function createTemplateContext(): [Function & Record<string, any>, Function] {
	/**
	 * Контекст шаблона для обеспечения состояния компонентов в дереве React.
	 *
	 * Используется для передачи данных состояния шаблона (TemplateStateValue)
	 * глубоко вложенным компонентам без необходимости явной передачи пропсов.
	 *
	 * @remarks
	 * Значение контекста изначально установлено в `null`, что позволяет проверять,
	 * был ли провайдер контекста правильно добавлен в дерево компонентов.
	 *
	 * @example
	 * ```tsx
	 * const App = () => (
	 *   <TemplateContext.Provider value={templateState}>
	 *     <ChildComponent />
	 *   </TemplateContext.Provider>
	 * );
	 * ```
	 */
	const TemplateContext = createContext<TemplateStateValue | null>(null);

	/**
	 * Хук для работы с менеджером шаблонов.
	 *
	 * Предоставляет функции для получения и проверки наличия шаблонов по их имени слота.
	 * Должен использоваться только внутри компонента `Template.Provider`, иначе будет выброшена ошибка.
	 *
	 * @returns Объект с двумя методами:
	 * - `getTemplates` — возвращает шаблон по имени слота.
	 * - `hasTemplate` — проверяет, существует ли шаблон для указанного имени слота.
	 *
	 * @throws Ошибка, если хук используется вне контекста `Template.Provider`.
	 *
	 * @example
	 * const { getTemplates, hasTemplate } = useTemplateManager();
	 *
	 * if (hasTemplate('header')) {
	 *   const HeaderTemplate = getTemplates('header');
	 *   return <HeaderTemplate />;
	 * }
	 */
	function useTemplateManager() {
		const context = useContext(TemplateContext);

		if (!context) {
			throw new Error(
				'useTemplateManager должен использоваться внутри Template.Provider',
			);
		}

		return {
			/**
			 * Возвращает шаблон по имени слота.
			 *
			 * @param slotName - Имя слота, для которого запрашивается шаблон.
			 * @returns Шаблон, связанный с указанным именем слота, или `undefined`, если шаблон не найден.
			 */
			getTemplate: (slotName: string): any => context.templates[slotName],

			/**
			 * Проверяет, существует ли шаблон для указанного имени слота.
			 *
			 * @param slotName - Имя слота, для которого проверяется наличие шаблона.
			 * @returns `true`, если шаблон существует; `false` — в противном случае.
			 */
			hasTemplate: (slotName: string): boolean => !!context.templates[slotName],
		};
	}

	/**
	 * Функциональный компонент шаблона, позволяющий динамически управлять вставкой элементов
	 * в определённые слоты с помощью контекста.
	 *
	 * @param props - Свойства компонента Template.
	 * @param props.slot - Имя слота, в который должен быть вставлен элемент. По умолчанию 'default'.
	 * @param props.children - Дочерние элементы или функция, возвращающая элементы.
	 * @param props - Дополнительные свойства, которые будут переданы дочернему элементу.
	 *
	 * @returns Возвращает функцию, которая также содержит статические методы:
	 * - `Has` — проверяет наличие элемента в указанном слоте.
	 * - `Slot` — вспомогательный компонент для отображения содержимого слота.
	 * - `use` — хук для доступа к содержимому слота в функциональных компонентах.
	 * - `Provider` — компонент провайдера контекста для управления слотами.
	 *
	 * @example
	 * ```tsx
	 * <Template slot="header">
	 *   <h1>Заголовок</h1>
	 * </Template>
	 * ```
	 *
	 * @remarks
	 * Если контекст `TemplateContext` отсутствует, компонент работает как прокси:
	 * - Если `children` — функция, она вызывается с `props`.
	 * - Иначе возвращаются `children` без изменений.
	 *
	 * Элемент регистрируется в менеджере слотов при монтировании и автоматически
	 * удаляется при размонтировании.
	 */
	function Template({ slot = 'default', children, ...props }: TemplateProps) {
		const manager = useContext(TemplateContext);
		const [uniqueId] = useState(useId());

		const element = useMemo(
			() =>
				isValidElement(children)
					? cloneElement(children, { key: uniqueId, ...props })
					: children,
			[children, uniqueId],
		);

		useEffect(() => {
			if (!manager) {
				return;
			}

			manager.register(slot, element);

			return () => {
				manager.unregister(slot);
			};
		}, [slot, element]);

		if (!manager) {
			return typeof children === 'function'
				? (children as Function)(props)
				: children;
		}

		return null;
	}

	/**
	 * Создает и возвращает контекст шаблонов с состоянием и методами для управления шаблонами.
	 *
	 * @returns Объект контекста, содержащий текущие шаблоны и действия для их регистрации и удаления.
	 *
	 * @example
	 * const { templates, register, unregister } = factoryContext();
	 */
	function factoryContext(): TemplateContextValue {
		/**
		 * Состояние, хранящее зарегистрированные шаблоны, где ключ — имя слота, значение — React-элемент.
		 *
		 * @type {TemplateStateValue}
		 */
		const [templates, setTemplates] = useState<TemplateStateValue>({});

		/**
		 * Мемоизированный объект с методами для управления шаблонами.
		 * Включает методы `register` и `unregister`, которые позволяют регистрировать и удалять шаблоны по имени слота.
		 *
		 * @constant
		 * @type {Omit<TemplateContextValue, 'templates'>}
		 */
		const actions = useMemo<Omit<TemplateContextValue, 'templates'>>(
			() => ({
				register: (slotName: string, element: React.ReactNode) => {
					setTemplates(
						(prev: TemplateStateValue): TemplateStateValue => ({
							...prev,
							[slotName]: element,
						}),
					);
				},
				unregister: (slotName: string) => {
					setTemplates((prev: TemplateStateValue): TemplateStateValue => {
						const { [slotName]: _, ...rest } = prev;
						return rest;
					});
				},
			}),
			[],
		);

		/**
		 * Мемоизированный объект, объединяющий текущие шаблоны и действия.
		 * Пересоздаётся только при изменении состояния `templates`.
		 *
		 * @returns {TemplateContextValue} Полный объект контекста шаблонов.
		 */
		return useMemo<TemplateContextValue>(
			() => ({
				templates,
				...actions,
			}),
			[templates],
		);
	}
	Template.factory = factoryContext;

	/**
	 * Компонент провайдера контекста для шаблона.
	 *
	 * Обеспечивает передачу контекста компонентам-потомкам через React Context API.
	 * Если значение контекста не передано явно, создаётся новое значение с помощью функции factoryContext.
	 *
	 * @param {Object} props - Свойства компонента провайдера.
	 * @param {React.ReactNode} props.children - Дочерние элементы, которым будет доступен контекст.
	 * @param {TemplateContextType} [props.value] - Опциональное значение контекста. Если не указано, используется результат вызова factoryContext().
	 *
	 * @returns {JSX.Element} Обёртка провайдера контекста для дочерних компонентов.
	 */
	function TemplateProvider({ children, value }: TemplateProviderProps) {
		const contextValue = value || factoryContext();
		return (
			<TemplateContext.Provider value={contextValue}>
				{children}
			</TemplateContext.Provider>
		);
	}
	Template.Provider = TemplateProvider;

	/**
	 * Компонент слота шаблона, используемый для динамической вставки контента в шаблон.
	 *
	 * Слоты позволяют определять области в шаблоне, которые могут быть заменены пользовательским контентом.
	 * Если контекст шаблона недоступен, компонент выводит переданный `children` или `null`.
	 * Поддерживает статическое содержимое, функции-рендереры и React-элементы.
	 *
	 * @param props - Свойства компонента слота.
	 * @param props.name - Имя слота (по умолчанию 'default'). Используется для поиска соответствующего шаблона в менеджере.
	 * @param props.children - Резервное содержимое, отображаемое, если шаблон не найден или контекст недоступен.
	 * @param props.slotProps - Дополнительные свойства, передаваемые в шаблон (например, данные или обработчики).
	 *
	 * @example
	 * <Template.Slot name="header" title="Заголовок" />
	 *
	 * @remarks
	 * Если контекст `TemplateContext` отсутствует, выводится предупреждение в консоль.
	 * Это может указывать на неправильное использование компонента вне `Template.Provider`.
	 *
	 * @returns Содержимое слота: результат выполнения функции, клонированный элемент или `children`.
	 */
	function TemplateSlot({
		name = 'default',
		children,
		...slotProps
	}: TemplateSlotProps) {
		const manager = useContext(TemplateContext);

		// Если нет менеджера, используем children как fallback
		if (!manager) {
			console.warn('Template.Slot используется вне Template.Provider');
			return children || null;
		}

		const template = manager.templates[name] || children;

		// Если шаблона не валиден
		if (!isValidElement(template)) {
			return <>{template}</>;
		}
		if (typeof template === 'function') {
			// Для функциональных шаблонов передаем параметры
			return (template as Function)(slotProps);
		}

		// Для статических элементов клонируем с props
		return cloneElement(template, { ...slotProps, key: template.key });
	}
	Template.Slot = TemplateSlot;

	/**
	 * Компонент для условного рендеринга дочерних элементов на основе наличия шаблона с указанным именем.
	 *
	 * @param {Object} props - Свойства компонента.
	 * @param {string} props.name - Имя шаблона, наличие которого проверяется.
	 * @param {React.ReactNode} props.children - Дочерние элементы, которые будут отображены, если шаблон существует.
	 *
	 * @returns {React.ReactNode} Возвращает дочерние элементы, если шаблон с указанным именем найден; иначе — `null`.
	 *
	 * @example
	 * <Template.Has name="header">
	 *   <div>Шапка отображается, так как шаблон "header" существует</div>
	 * </Template.Has>
	 */
	function TemplateHas({
		name,
		children,
	}: {
		name: string;
		children: React.ReactNode;
	}) {
		const { hasTemplate } = useTemplateManager();
		return hasTemplate(name) ? children : null;
	}
	Template.Has = TemplateHas;

	/**
	 * Хук для получения контекста шаблона.
	 *
	 * Использует React-хук `useContext` для извлечения значений из контекста `TemplateContext`.
	 * Предоставляет удобный способ доступа к данным и функциям, предоставляемым провайдером `TemplateContext`.
	 *
	 * @returns {Тип значения контекста} Возвращает текущее значение контекста `TemplateContext`.
	 *
	 * @example
	 * const templateContext = Template.use();
	 * console.log(templateContext);
	 */
	function useTemplate() {
		return useContext(TemplateContext);
	}
	Template.use = useTemplate;

	return [Template, useTemplateManager];
}
