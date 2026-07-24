/**
 * Маппинг Mantine → Ant Design (шпаргалка для миграции).
 * Полный план: docs/MANTINE_TO_ANTD.md
 */

export const MANTINE_TO_ANTD = {
	Button: 'antd.Button',
	TextInput: 'antd.Input',
	PasswordInput: 'antd.Input.Password',
	Textarea: 'antd.Input.TextArea',
	Select: 'antd.Select',
	Checkbox: 'antd.Checkbox',
	Radio: 'antd.Radio',
	Modal: 'antd.Modal',
	Alert: 'antd.Alert',
	Loader: 'antd.Spin',
	Stack: 'antd.Flex vertical / Space',
	Group: 'antd.Flex / Space',
	Box: 'div + style/Tailwind',
	ActionIcon: 'antd.Button type=text icon',
	notifications: 'antd.notification / message',
	modals: 'antd.Modal.confirm',
	DateTimePicker: 'antd.DatePicker showTime',
	DataTable: 'ui/data-table (antd Table facade)',
} as const;
