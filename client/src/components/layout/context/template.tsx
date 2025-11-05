import React, { createContext, useContext } from 'react';

type TemplateManagerStateType = Record<string, any>;
type TemplateManagerContextType = {
	templates: TemplateManagerStateType;
	register: (slotName: string, element: any) => void;
	unregister: (slotName: string) => void;
};

const SlotContext = createContext({});

export const useSlots = () => {
	return useContext(SlotContext);
};

export const SlotProvider = ({ slots, children }) => {
	return <SlotContext.Provider value={slots}>{children}</SlotContext.Provider>;
};

const Template = ({ children, ...scopedSlots }) => {
	// Собираем все слоты из children
	const slots = {};

	React.Children.forEach(children, (child) => {
		if (React.isValidElement(child) && child.type === Template.Slot) {
			const slotName = child.props.name || 'default';
			slots[slotName] = child.props.children;
		}
	});

	// Объединяем с scoped slots (слоты с областью видимости)
	const allSlots = { ...slots, ...scopedSlots };

	return <SlotProvider slots={allSlots}>{children}</SlotProvider>;
};

Template.Slot = ({
	name = 'default',
	children,
	...slotProps
}: {
	name: string;
	children?: React.ReactNode;
	[key: string]: any;
}) => {
	const slots = useSlots();
	const slotContent = slots[name];

	// Если слот не передан, используем содержимое по умолчанию
	if (!slotContent) {
		return children || null;
	}

	// Если слот - функция (scoped slot), передаем ей параметры
	if (typeof slotContent === 'function') {
		return slotContent(slotProps);
	}

	// Если слот - React элемент
	return slotContent;
};
