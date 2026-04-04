import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { AuthProvider } from "./contexts/auth.ctx.tsx";
import { InfoProvider } from "./contexts/info.ctx.tsx";
import '@mantine/core/styles.css';

import { MantineProvider } from '@mantine/core';

createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<MantineProvider defaultColorScheme="auto">
			<AuthProvider>
				<InfoProvider>
					<App />
				</InfoProvider>
			</AuthProvider>
		</MantineProvider>
	</StrictMode>,
);
