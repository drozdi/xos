import '@mantine/core/styles/ActionIcon.css';
import '@mantine/core/styles/AppShell.css';
import '@mantine/core/styles/Button.css';
import '@mantine/core/styles/CloseButton.css';
import '@mantine/core/styles/Flex.css';
import '@mantine/core/styles/FloatingIndicator.css';
import '@mantine/core/styles/global.css';
import '@mantine/core/styles/Group.css';
import '@mantine/core/styles/InlineInput.css';
import '@mantine/core/styles/Input.css';
import '@mantine/core/styles/Loader.css';
import '@mantine/core/styles/ModalBase.css';
import '@mantine/core/styles/Overlay.css';
import '@mantine/core/styles/Paper.css';
import '@mantine/core/styles/Popover.css';
import '@mantine/core/styles/ScrollArea.css';
import '@mantine/core/styles/Skeleton.css';
import '@mantine/core/styles/UnstyledButton.css';
import '@mantine/core/styles/VisuallyHidden.css';

import { createRoot } from 'react-dom/client';
import App from './App';
import { core as XOS } from './core';
XOS.app(
	App,
	{
		smKey: 'core',
	},
	createRoot(document.getElementById('root')),
);
