import cls from 'clsx';
import { createElement as h } from 'react';
import * as TbIcons from 'react-icons/tb';
import { camelize, capitalize } from '../../../utils/string';

interface IconProps {
	children?: string;
	className?: string;
	name?: string;
	color?: string;
	as?: string;
	size?: number | string;
	title?: string;
	[key: string]: any;
}

const replace = (str: string) => {
	return str.replace('mdi-', 'tb-');
};
const getIcon = (name: string) => {
	return TbIcons?.[capitalize(camelize(name))] || '';
};

export function Icon({
	children,
	className,
	color,
	size,
	title,
	as = 'i',
	...props
}: IconProps) {
	if (!children) {
		return '';
	}
	color &&= color = ' text-' + color;
	color ||= '';

	let name = replace(children);

	if (!/^tb-/.test(name)) {
		name = 'tb-' + name;
	}
	if (name === 'tb-close') {
		name = 'tb-x';
	}

	const Icon = getIcon(name);
	return h(
		as,
		{
			...props,
			className: cls(color, name.split('-')[0], name, className),
			role: 'presentation',
			'aria-hidden': 'true',
		},
		Icon && <Icon size={size} title={title} />,
	);
}
