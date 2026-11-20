import { Button, Group, MultiSelect, PasswordInput, Select, Stack, Tabs, Text, TextInput } from '@mantine/core';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

import { extractApiErrorMessage } from '@/core/api/apiError';
import { queryKeys } from '@/core/api/queryKeys';
import { useAppContext } from '@/core/context/AppContext';
import { useWindowTitle } from '@/core/hooks/useWindowTitle';

import { runCommand } from './domainCommand';
import type { DomainEntry } from './DomainTab';

const USER_FIELDS: Array<[string, string]> = [
	['givenName', 'Имя'],
	['sn', 'Фамилия'],
	['displayName', 'Отображаемое имя'],
	['description', 'Описание'],
	['mail', 'Почта'],
	['telephoneNumber', 'Телефон'],
	['title', 'Должность'],
	['department', 'Отдел'],
	['company', 'Компания'],
	['physicalDeliveryOfficeName', 'Кабинет'],
	['homeDirectory', 'Домашний каталог'],
	['homeDrive', 'Домашний диск'],
	['scriptPath', 'Сценарий входа'],
	['profilePath', 'Профиль'],
];

const GROUP_FIELDS: Array<[string, string]> = [
	['description', 'Описание'],
	['mail', 'Почта'],
];

const OU_FIELDS: Array<[string, string]> = [
	['description', 'Описание'],
];

type Kind = 'user' | 'group' | 'ou';

type RecordView = {
	dn: string;
	cn: string;
	attributes: Record<string, string[]>;
};

function asEntries(value: unknown): DomainEntry[] {
	if (!Array.isArray(value)) {
		return [];
	}
	return value.filter((item): item is DomainEntry => {
		return !!item && typeof item === 'object' && typeof (item as DomainEntry).name === 'string';
	});
}

function parentDn(dn: string): string {
	const comma = dn.indexOf(',');
	return comma >= 0 ? dn.slice(comma + 1) : '';
}

function first(attributes: Record<string, string[]>, key: string): string {
	const found = Object.entries(attributes).find(([name]) => name.toLowerCase() === key.toLowerCase());
	return found?.[1]?.[0] ?? '';
}

function namesFor(dns: string[], entries: DomainEntry[]): string[] {
	const wanted = new Set(dns.map((item) => item.toLowerCase()));
	return entries.filter((item) => wanted.has(item.dn.toLowerCase())).map((item) => item.name);
}

export function DomainObject() {
	const { props } = useAppContext();
	const queryClient = useQueryClient();
	const serverId = Number(props?.serverId ?? 0);
	const kind = (props?.kind === 'group' || props?.kind === 'ou' ? props.kind : 'user') as Kind;
	const create = props?.create === true;
	const canManage = props?.canManage === true;
	const ous = asEntries(props?.ous);
	const users = asEntries(props?.users);
	const groups = asEntries(props?.groups);
	const [name, setName] = useState(typeof props?.name === 'string' ? props.name : '');
	const [fields, setFields] = useState<Record<string, string>>({});
	const [parent, setParent] = useState<string | null>(typeof props?.parent === 'string' ? props.parent : null);
	const [initialParent, setInitialParent] = useState('');
	const [picked, setPicked] = useState<string[]>([]);
	const [initialPicked, setInitialPicked] = useState<string[]>([]);
	const [initialFields, setInitialFields] = useState<Record<string, string>>({});
	const [password, setPassword] = useState('');
	const [passwordConfirm, setPasswordConfirm] = useState('');
	const [record, setRecord] = useState<RecordView | null>(null);
	const [note, setNote] = useState<string | null>(null);
	const [busy, setBusy] = useState(false);
	useWindowTitle(create ? 'Новая запись' : name || 'Запись');

	const shown = kind === 'user' ? USER_FIELDS : kind === 'group' ? GROUP_FIELDS : OU_FIELDS;

	useEffect(() => {
		if (create || !name) {
			return;
		}
		let cancelled = false;
		setBusy(true);
		void runCommand(serverId, 'object.read', { kind, name })
			.then((result) => {
				if (cancelled || !result) {
					return;
				}
				const parsed = JSON.parse(result) as RecordView;
				const attributes = parsed.attributes ?? {};
				const nextFields: Record<string, string> = {};
				for (const [key] of shown) {
					nextFields[key] = first(attributes, key);
				}
				const nextParent = parentDn(parsed.dn ?? '');
				const source = kind === 'group' ? firstList(attributes, 'member') : firstList(attributes, 'memberOf');
				const nextPicked = namesFor(source, kind === 'group' ? users : groups);
				setRecord({ dn: parsed.dn ?? '', cn: parsed.cn ?? '', attributes });
				setFields(nextFields);
				setInitialFields(nextFields);
				setParent(nextParent || null);
				setInitialParent(nextParent);
				setPicked(nextPicked);
				setInitialPicked(nextPicked);
			})
			.catch((reason: unknown) => {
				if (!cancelled) {
					setNote(reason instanceof Error ? reason.message : extractApiErrorMessage(reason));
				}
			})
			.finally(() => {
				if (!cancelled) {
					setBusy(false);
				}
			});
		return () => {
			cancelled = true;
		};
	}, [create, kind, name, serverId]);

	const ouOptions = ous.map((item) => ({ value: item.dn, label: `${item.cn || item.name} · ${item.dn}` }));
	const pickOptions = (kind === 'group' ? users : groups).map((item) => ({
		value: item.name,
		label: kind === 'group' ? userLabel(item) : item.name,
	}));

	const passwordError = (): string | null => {
		if (!password) {
			return create && kind === 'user' ? 'Укажите пароль' : null;
		}
		if (password.length < 8) {
			return 'Пароль не короче 8 символов';
		}
		if (password !== passwordConfirm) {
			return 'Пароли не совпадают';
		}
		return null;
	};

	const changePassword = async () => {
		const error = passwordError();
		if (error) {
			setNote(error);
			return;
		}
		if (!name) {
			setNote('Имя пользователя не задано');
			return;
		}
		setBusy(true);
		setNote(null);
		try {
			await runCommand(serverId, 'user.set_password', { name, password });
			setPassword('');
			setPasswordConfirm('');
			setNote('Пароль изменён');
		} catch (reason: unknown) {
			setNote(reason instanceof Error ? reason.message : extractApiErrorMessage(reason));
		} finally {
			setBusy(false);
		}
	};

	const save = async () => {
		setBusy(true);
		setNote(null);
		try {
			if (create) {
				if (kind === 'user') {
					const error = passwordError();
					if (error) {
						setNote(error);
						return;
					}
					await runCommand(serverId, 'user.ensure', {
						name,
						given_name: fields.givenName ?? '',
						surname: fields.sn ?? '',
						ou: ous.find((item) => item.dn === parent)?.name ?? '',
						password,
					});
					if (parent && !ous.some((item) => item.dn === parent)) {
						await runCommand(serverId, 'object.move', { kind, name, parent });
					}
				} else if (kind === 'group') {
					await runCommand(serverId, 'group.ensure', { name });
				} else {
					await runCommand(serverId, 'ou.ensure', {
						name,
						parent: ous.find((item) => item.dn === parent)?.name ?? '',
					});
				}
			}
			if (!create && parent && parent !== initialParent) {
				await runCommand(serverId, 'object.move', { kind, name, parent });
			}
			if (create && kind === 'group' && parent) {
				await runCommand(serverId, 'object.move', { kind, name, parent });
			}
			const changed = Object.fromEntries(
				shown
					.filter(([key]) => (fields[key] ?? '') !== (initialFields[key] ?? ''))
					.map(([key]) => [key, fields[key] ?? '']),
			);
			if (Object.keys(changed).length > 0) {
				await runCommand(serverId, 'object.write', { kind, name, attributes: changed });
			}
			const added = picked.filter((item) => !initialPicked.includes(item));
			const removed = initialPicked.filter((item) => !picked.includes(item));
			for (const item of added) {
				await runCommand(serverId, 'group.members', {
					name: kind === 'group' ? name : item,
					member: kind === 'group' ? item : name,
					action: 'add',
				});
			}
			for (const item of removed) {
				await runCommand(serverId, 'group.members', {
					name: kind === 'group' ? name : item,
					member: kind === 'group' ? item : name,
					action: 'remove',
				});
			}
			setPassword('');
			setPasswordConfirm('');
			setInitialParent(parent ?? '');
			setInitialPicked(picked);
			setInitialFields(fields);
			await queryClient.invalidateQueries({ queryKey: queryKeys.samba.directory(serverId) });
			setNote('Готово');
		} catch (reason: unknown) {
			setNote(reason instanceof Error ? reason.message : extractApiErrorMessage(reason));
		} finally {
			setBusy(false);
		}
	};

	const account = async (type: 'user.enable' | 'user.disable') => {
		setBusy(true);
		setNote(null);
		try {
			await runCommand(serverId, type, { name });
			setNote('Готово');
		} catch (reason: unknown) {
			setNote(reason instanceof Error ? reason.message : extractApiErrorMessage(reason));
		} finally {
			setBusy(false);
		}
	};

	const attributeRows = Object.entries(record?.attributes ?? {}).sort(([left], [right]) => left.localeCompare(right, 'ru'));

	const sections: Array<{ title: string; keys: string[] }> = kind === 'user'
		? [
			{ title: 'Учётная запись', keys: ['givenName', 'sn', 'displayName', 'description'] },
			{ title: 'Контакт', keys: ['mail', 'telephoneNumber', 'title', 'department', 'company', 'physicalDeliveryOfficeName'] },
			{ title: 'Профиль', keys: ['homeDirectory', 'homeDrive', 'scriptPath', 'profilePath'] },
		]
		: [{ title: 'Свойства', keys: shown.map(([key]) => key) }];

	return (
		<Tabs defaultValue="card" keepMounted h="100%" style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
			<Tabs.List>
				<Tabs.Tab value="card">Карточка</Tabs.Tab>
				<Tabs.Tab value="attributes">Атрибуты</Tabs.Tab>
			</Tabs.List>
			<Tabs.Panel value="card" pt="sm" style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
		<Stack gap="sm" p="md">
			{create ? <TextInput label="Имя" value={name} onChange={(event) => setName(event.currentTarget.value)} /> : <Text fw={600}>{name}</Text>}
			<Text size="sm">CN: {record?.cn || '—'}</Text>
			<Text size="sm">DN: {record?.dn || '—'}</Text>
			<Select label="Подразделение" data={ouOptions} value={parent} onChange={setParent} searchable clearable disabled={!canManage} />
			{sections.map((section) => (
				<Stack key={section.title} gap="xs">
					<Text fw={600}>{section.title}</Text>
					{section.keys.map((key) => {
						const label = shown.find(([field]) => field === key)?.[1] ?? key;
						return (
							<TextInput
								key={key}
								label={label}
								value={fields[key] ?? ''}
								disabled={!canManage}
								onChange={(event) => setFields((current) => ({ ...current, [key]: event.currentTarget.value }))}
							/>
						);
					})}
				</Stack>
			))}
			{kind !== 'ou' ? (
				<Stack gap="xs">
					<Text fw={600}>{kind === 'group' ? 'Участники' : 'Группы'}</Text>
					<MultiSelect
						label={kind === 'group' ? 'Пользователи' : 'Группы'}
						data={pickOptions}
						value={picked}
						onChange={setPicked}
						searchable
						disabled={!canManage}
					/>
				</Stack>
			) : null}
			{kind === 'user' && canManage ? (
				<Stack gap="xs">
					<Text fw={600}>{create ? 'Пароль' : 'Смена пароля'}</Text>
					<PasswordInput
						label="Новый пароль"
						description="Не короче 8 символов"
						value={password}
						onChange={(event) => setPassword(event.currentTarget.value)}
					/>
					<PasswordInput
						label="Повтор пароля"
						value={passwordConfirm}
						onChange={(event) => setPasswordConfirm(event.currentTarget.value)}
					/>
					{!create ? (
						<Button w="fit-content" variant="light" loading={busy} onClick={() => void changePassword()}>
							Сменить пароль
						</Button>
					) : null}
				</Stack>
			) : null}
			{canManage ? (
				<Group>
					<Button loading={busy} onClick={() => void save()}>Сохранить</Button>
					{!create && kind === 'user' ? (
						<>
							<Button variant="light" disabled={busy} onClick={() => void account('user.disable')}>Отключить</Button>
							<Button variant="light" disabled={busy} onClick={() => void account('user.enable')}>Включить</Button>
						</>
					) : null}
				</Group>
			) : null}
			{note ? <Text size="sm">{note}</Text> : null}
		</Stack>
			</Tabs.Panel>
			<Tabs.Panel value="attributes" pt="sm" style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
				<Stack gap={4} p="md">
					{attributeRows.length === 0 ? <Text size="sm" c="dimmed">Атрибутов нет</Text> : null}
					{attributeRows.map(([key, values]) => (
						<Text key={key} size="sm" style={{ wordBreak: 'break-all' }}>
							{key}: {values.join(', ')}
						</Text>
					))}
				</Stack>
			</Tabs.Panel>
		</Tabs>
	);
}

function userLabel(item: DomainEntry): string {
	const display = (item.displayName ?? '').trim();
	return display ? `${display} · ${item.name}` : item.name;
}

function firstList(attributes: Record<string, string[]>, key: string): string[] {
	const found = Object.entries(attributes).find(([name]) => name.toLowerCase() === key.toLowerCase());
	return found?.[1] ?? [];
}
