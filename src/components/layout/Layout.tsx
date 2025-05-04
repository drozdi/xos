import '@mantine/core/styles/AppShell.css';
import '@mantine/core/styles/Burger.css';
import '@mantine/core/styles/Group.css';
import '@mantine/core/styles/ScrollArea.css';
import '@mantine/core/styles/Skeleton.css';
import './style.css';

import { AppShell, Box, em, Flex, ScrollArea, useMantineTheme } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import React, { useState } from 'react';
import { Resizable, ResizableProps } from 'react-resizable';

interface LayoutProps {
	header?: React.ReactNode;
	navbar?: React.ReactNode;
	aside?: React.ReactNode;
	footer?: React.ReactNode;
	children: React.ReactNode;
	breakpoint?: number;
	navbarWidth?: number;
	asideWidth?: number;
	minWidth?: number;
	maxWidth?: number;
}

export const Layout = ({
	header,
	navbar,
	aside,
	footer,
	children,
	breakpoint = 768,
	navbarWidth = 250,
	asideWidth = 300,
	minWidth = 200,
	maxWidth = 500,
}: LayoutProps) => {
	const theme = useMantineTheme();
	const isMobile = useMediaQuery(`(max-width: ${em(breakpoint)})`);
	const [navWidth, setNavWidth] = useState(navbarWidth);
	const [asideW, setAsideW] = useState(asideWidth);
	const [navVisible, setNavVisible] = useState(false);
	const [asideVisible, setAsideVisible] = useState(false);

	const ResizablePanel = ({
		width,
		onResize,
		position,
		children,
	}: ResizableProps & { position: 'left' | 'right'; children: React.ReactNode }) => (
		<Resizable
			width={width}
			height={0}
			onResize={onResize}
			resizeHandles={position === 'left' ? ['e'] : ['w']}
			axis="x"
			minConstraints={[minWidth, 0]}
			maxConstraints={[maxWidth, 0]}
			handle={(h) => (
				<Box
					pos="absolute"
					top={0}
					bottom={0}
					{...(position === 'left' ? { right: -8 } : { left: -8 })}
					w={16}
					style={{
						cursor: 'col-resize',
						zIndex: 100,
						background: 'transparent',
					}}
				/>
			)}
		>
			<Box
				w={width}
				h="100%"
				style={{
					position: isMobile ? 'absolute' : 'relative',
					zIndex: 200,
					transition: 'transform 0.3s ease',
					[position]: isMobile
						? position === 'left'
							? navVisible
								? 0
								: -width
							: asideVisible
								? 0
								: -width
						: 0,
				}}
			>
				{children}
			</Box>
		</Resizable>
	);

	return (
		<AppShell
			header={{ height: header ? 60 : 0 }}
			footer={{ height: footer ? 60 : 0 }}
			navbar={
				navbar
					? {
							width: navWidth,
							breakpoint,
							collapsed: { mobile: !navVisible, desktop: false },
						}
					: undefined
			}
			aside={
				aside
					? {
							width: asideW,
							breakpoint,
							collapsed: { mobile: !asideVisible, desktop: false },
						}
					: undefined
			}
		>
			{/* Header */}
			{header && (
				<AppShell.Header p="md">
					<Flex align="center" h="100%">
						{header}
					</Flex>
				</AppShell.Header>
			)}

			{/* Navbar */}
			{navbar && (
				<AppShell.Navbar>
					<AppShell.Section grow my="md" component={ScrollArea}>
						{navbar}
					</AppShell.Section>
					{isMobile && (
						<Box
							pos="absolute"
							right={-40}
							top="50%"
							onClick={() => setNavVisible(false)}
						>
							×
						</Box>
					)}
				</AppShell.Navbar>
			)}

			{/* Main Content */}
			<AppShell.Main>
				<Box
				/*style={{
						height: '100%',
						marginLeft: !isMobile && navbar ? navWidth : 0,
						marginRight: !isMobile && aside ? asideW : 0,
					}}*/
				>
					{children}

					{/* Mobile Controls */}
					{isMobile && (
						<Box
							pos="fixed"
							bottom={20}
							left={20}
							style={{ zIndex: 300, display: 'flex', gap: 10 }}
						>
							{navbar && !navVisible && (
								<button onClick={() => setNavVisible(true)}>
									☰ Nav
								</button>
							)}
							{aside && !asideVisible && (
								<button onClick={() => setAsideVisible(true)}>
									☰ Aside
								</button>
							)}
						</Box>
					)}
				</Box>
			</AppShell.Main>

			{/* Aside */}
			{aside && (
				<AppShell.Aside p="md">
					<ResizablePanel
						width={asideW}
						position="right"
						onResize={(_, { size }) => !isMobile && setAsideW(size.width)}
					>
						{aside}
						{isMobile && (
							<Box
								pos="absolute"
								left={-40}
								top="50%"
								onClick={() => setAsideVisible(false)}
							>
								×
							</Box>
						)}
					</ResizablePanel>
				</AppShell.Aside>
			)}

			{/* Footer */}
			{footer && (
				<AppShell.Footer p="md">
					<Flex align="center" h="100%">
						{footer}
					</Flex>
				</AppShell.Footer>
			)}
		</AppShell>
	);
};

/*
type LayoutProps = {
	view?: string;
	breakpoint?: number;
	overlay?: boolean;
	children?: React.ReactNode;
}

const parseLayout = (view: string) => {
	const [header, main, footer] = view.split(' ');
	return {
	  header: header?.split('') || [],
	  main: main?.split('') || [],
	  footer: footer?.split('') || [],
	};
  };
let ii: number = 0;
export function Layout({
	view = 'hhh lmr fff',
	breakpoint = 600,
	overlay = false,
}: LayoutProps) {
	console.log(ii++)
  const [opened, { toggle }] = useDisclosure();

  const isMobile = useMediaQuery(`(max-width: ${breakpoint}px)`);
  const [navbarWidth, setNavbarWidth] = useState(250);
  const [asideWidth, setAsideWidth] = useState(300);
  const [navbarOpened, setNavbarOpened] = useState(false);
  const [asideOpened, setAsideOpened] = useState(false);

  const { header, main, footer } = parseLayout(view);

  const handleNavbarResize = (e, { size }) => {
    if (!isMobile) setNavbarWidth(size.width);
  };

  const handleAsideResize = (e, { size }) => {
    if (!isMobile) setAsideWidth(size.width);
  };

  const ResizableNavbar = ({ width, children }) => (
    <Resizable
      width={width}
      height={0}
      onResize={handleNavbarResize}
      resizeHandles={['e']}
      axis="x"
      disabled={isMobile}
    >
      <Box w={width} h="100%">
        {children}
      </Box>
    </Resizable>
  );

  const ResizableAside = ({ width, children }) => (
    <Resizable
      width={width}
      height={0}
      onResize={handleAsideResize}
      resizeHandles={['w']}
      axis="x"
      disabled={isMobile}
    >
      <Box w={width} h="100%">
        {children}
      </Box>
    </Resizable>
  );


  return (
     <AppShell
		header={{ height: header?.length ? 60 : 0 }}
		footer={{ height: footer?.length ? 60 : 0 }}
		navbar={{
			width: navbarWidth,
			breakpoint: breakpoint,
			collapsed: { mobile: !navbarOpened, desktop: !main.includes('l') }
		}}
		aside={{
			width: asideWidth,
			breakpoint: breakpoint,
			collapsed: { mobile: !asideOpened, desktop: !main.includes('r') }
		}}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md">
          <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
        </Group>
      </AppShell.Header>
      <AppShell.Navbar>
		  <AppShell.Section grow my="md" component={ScrollArea}>
              Navbar Content
              {isMobile && overlay && (
                <button onClick={() => setNavbarOpened(false)}>Close</button>
              )}
			  {Array(30)
				.fill(0)
				.map((_, index) => (
					<Skeleton key={index} h={28} mt="sm" animate={false} />
				))}
			</AppShell.Section>

      </AppShell.Navbar>
      <AppShell.Main>
        Aside is hidden on on md breakpoint and cannot be opened when it is collapsed
      </AppShell.Main>
      <AppShell.Aside p="md">Aside</AppShell.Aside>
      <AppShell.Footer p="md">Footer</AppShell.Footer>
    </AppShell>
  );
}

/*


export const Layout = ({
	view = "hhh lmr fff",
	breakpoint = 768,
	overlay = false,
	children,
}) => {
	const isMobile = useMediaQuery(`(max-width: ${breakpoint}px)`);
	const [navbarWidth, setNavbarWidth] = useState(250);
	const [asideWidth, setAsideWidth] = useState(300);
	const [navbarOpened, setNavbarOpened] = useState(false);
	const [asideOpened, setAsideOpened] = useState(false);

	const { header, main, footer } = parseLayout(view);

	const handleNavbarResize = (e, { size: { width } }) => {
		if (!isMobile) setNavbarWidth(width);
	};

	const handleAsideResize = (e, { size: { width } }) => {
		if (!isMobile) setAsideWidth(width);
	};

	const ResizableNavbar = ({ width, children }) => (
		<Resizable
		width={width}
		height={0}
		onResize={handleNavbarResize}
		resizeHandles={['e']}
		axis="x"
		disabled={isMobile}
		>
		<Box w={width} h="100%">
			{children}
		</Box>
		</Resizable>
	);

	const ResizableAside = ({ width, children }) => (
		<Resizable
		width={width}
		height={0}
		onResize={handleAsideResize}
		resizeHandles={['w']}
		axis="x"
		disabled={isMobile}
		>
		<Box w={width} h="100%">
			{children}
		</Box>
		</Resizable>
	)


	return (<AppShell
		header={{ height: header?.length ? 60 : 0 }}
		footer={{ height: footer?.length ? 60 : 0 }}
		navbar={{
			width: navbarWidth,
			breakpoint: breakpoint,
			collapsed: { mobile: !navbarOpened, desktop: !main.includes('l') }
		}}
		aside={{
			width: asideWidth,
			breakpoint: breakpoint,
			collapsed: { mobile: !asideOpened, desktop: !main.includes('r') }
		}}
		h="100%"
		w="100%"
	>
		{children}
	</AppShell>);
}*/
