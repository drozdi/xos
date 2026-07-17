import { cloneElement, isValidElement, useEffect, useId, useMemo } from "react";
import { useStoreTemplate } from '@inccom/shared/stores/template';
import { Title } from '@inccom/shared/ui';

export function Template({
	slot = "default",
	children,
	...props
}: {
	slot?: string;
	children?: React.ReactNode;
	[key: string]: any;
}) {
	const uniqueId = useId();

	const element = useMemo(
		() =>
			isValidElement(children)
				? cloneElement(children, { key: uniqueId, ...props })
				: children,
		[children, uniqueId],
	);

	useEffect(() => {
		useStoreTemplate.getState().register(slot, element);

		return () => {
			useStoreTemplate.getState().unregister(slot);
		};
	}, [slot, element]);

	return null;
}

function TemplateSlot({
	name = "default",
	children,
	...slotProps
}: {
	name?: string;
	children?: React.ReactNode;
	[key: string]: any;
}) {
	const { templates } = useStoreTemplate();

	const template = templates[name] || children;

	if (typeof template === "function") {
		return (template as Function)(slotProps);
	}

	if (!isValidElement(template)) {
		return <>{template}</>;
	}

	return cloneElement(template, { ...slotProps, key: template.key });
}
Template.Slot = TemplateSlot;

function useTemplate() {
	const { templates } = useStoreTemplate();
	return {
		get: (slotName: string): React.ReactNode => templates[slotName],
		has: (slotName: string): boolean => !!templates[slotName],
	};
}
Template.use = useTemplate;

function TemplateHas({
	name,
	children,
}: {
	name: string;
	children: React.ReactNode;
}) {
	const { has } = useTemplate();
	return has(name) ? children : null;
}
Template.Has = TemplateHas;

Template.Title = ({
	children,
	...props
}: {
	children: React.ReactNode;
	[key: string]: any;
}) => {
	const manager = Template.use();
	if (!manager) {
		return <Title {...props}>{children}</Title>;
	}
	return <Template slot="title">{children}</Template>;
};

Template.Footer = ({ children }: { children: React.ReactNode }) => (
	<Template slot="footer">{children}</Template>
);
