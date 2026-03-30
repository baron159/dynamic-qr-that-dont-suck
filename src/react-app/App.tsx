// src/App.tsx

import { useState } from "react";
// import reactLogo from "./assets/react.svg";
// import viteLogo from "/vite.svg";
// import cloudflareLogo from "./assets/Cloudflare_Logo.svg";
// import honoLogo from "./assets/hono.svg";
import { AppShell } from '@mantine/core';
import "./App.css";
import { Route, Switch } from 'wouter';
import PrivateRoute from "./componets/private.route";
import EntryPage from "./pages/EntryPage";
import { Dashboard } from "./pages/Dashboard";
import Landing from "./pages/Landing.tsx";

function App() {


    return (
        <>
            <AppShell header={{ height: 56, offset: true }}>
                <AppShell.Header>
                    Better QR
                </AppShell.Header>
                <AppShell.Main style={{ minHeight: 'calc(100vh - 64px)' }}>
                    <Switch>
                        <Route path='/' component={Landing} />
                        <Route path="/login" component={EntryPage} />
                        <PrivateRoute path="/dashboard" component={Dashboard} />
                    </Switch>
                </AppShell.Main>
                <AppShell.Footer>
                    Footer
                </AppShell.Footer>
            </AppShell>
        </>
    );
}

export default App;
