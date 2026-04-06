import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { AuthProvider } from "./contexts/auth.ctx.tsx";
import { InfoProvider } from "./contexts/info.ctx.tsx";
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';

import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';


createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<MantineProvider defaultColorScheme="auto">
			<Notifications />
			<AuthProvider>
				<InfoProvider>
					<App />
				</InfoProvider>
			</AuthProvider>
		</MantineProvider>
	</StrictMode>,
);
