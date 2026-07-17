import { MainMenu } from '@inccom/features/menu/sidebar';
import { useBreakpoint } from '@inccom/shared/hooks';
import { $setting } from '@inccom/shared/setting';
import { Title } from '@inccom/shared/ui';
import {
	ActionIcon,
	AppShell,
	Burger,
	Button,
	Container,
	Divider,
	Group,
	ScrollArea,
} from '@mantine/core';
import { useMemo } from 'react';
import { TbArrowBarLeft, TbArrowBarRight } from 'react-icons/tb';
import { Outlet, useNavigate } from 'react-router-dom';

import { Template } from './store';

export function MainLayout() {
	const navigate = useNavigate();
	const breakpoint = useBreakpoint('sm');
	const back = useMemo<boolean>(() => {
		return window?.history?.state?.idx > 0;
	}, [window?.history?.state?.idx]);
	const [mobileOpened, { toggle: toggleMobile }] = $setting.useDisclosure(
		'layout.mobile',
		false,
	);
	const [desktopOpened, { toggle: toggleDesktop }] = $setting.useDisclosure(
		'layout.desktop',
		false,
	);

	return (
		<AppShell
			layout="alt"
			header={{ height: 52 }}
			footer={{ height: 48 }}
			navbar={{
				width: desktopOpened ? 280 : 64,
				breakpoint: 'sm',
				collapsed: {
					mobile: !mobileOpened,
				},
			}}
			style={{ height: '100%', minHeight: 0 }}
		>
			<AppShell.Header>
				<Group h="100%" px="md" justify="space-between">
					<Group>
						<Burger
							opened={mobileOpened}
							onClick={toggleMobile}
							hiddenFrom="sm"
							size="sm"
						/>
						<ActionIcon
							onClick={toggleDesktop}
							visibleFrom="sm"
							variant="default"
						>
							{desktopOpened ? <TbArrowBarLeft /> : <TbArrowBarRight />}
						</ActionIcon>
						<Divider orientation="vertical" />
						<Title order={1} size="h3" fw="400">
							<Template.Slot name="title" />
						</Title>
					</Group>
					<Template.Slot name="header" />
				</Group>
			</AppShell.Header>
			<AppShell.Navbar>
				<AppShell.Section p="xs">
					<Burger
						opened={mobileOpened}
						onClick={toggleMobile}
						hiddenFrom="sm"
						size="sm"
					/>
				</AppShell.Section>
				<AppShell.Section grow my="xs" component={ScrollArea} px="xs">
					<MainMenu mini={!breakpoint && !desktopOpened} />
				</AppShell.Section>
			</AppShell.Navbar>
			<AppShell.Main style={{ minHeight: 0 }}>
				<ScrollArea h="100%">
					<Container size="xl" p="md">
						<Outlet />
					</Container>
				</ScrollArea>
			</AppShell.Main>
			<AppShell.Footer px="xs">
				<Group justify="space-between" gap="xs">
					<Template.Slot name="footer">
						<div />
					</Template.Slot>
					<Button
						color="dark"
						size="sm"
						disabled={!back}
						onClick={() => navigate(-1)}
					>
						Назад
					</Button>
				</Group>
			</AppShell.Footer>
		</AppShell>
	);
}
