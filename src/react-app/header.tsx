import { useAuth } from "./contexts/auth.ctx";
import { Group, Button, Switch, useMantineColorScheme, ActionIcon, Burger, Drawer, Stack } from "@mantine/core";
import { useLocation } from "wouter";
import { useState } from 'react';
import { useDisclosure } from "@mantine/hooks";
import styles from './header.module.css';
import { SunIcon, MoonStarsIcon, XIcon } from '@phosphor-icons/react';


export default function Header() {
    const [path, nav] = useLocation();
    const { colorScheme, setColorScheme } = useMantineColorScheme();
    const { isAuthenticated, signout } = useAuth();
    const [drawerOpened, { toggle: toggleDrawer, close: closeDrawer }] = useDisclosure(false);
    const [systemMsgs, setSysMsgs] = useState<string[]>([
        'Desktop Browser is currently the recommended way of using the App, we are working out a few things in the Mobile view'
    ]);

    const goTo = (target: string) => {
        nav(target);
        closeDrawer();
    };

    const colorSchemeSwitch = (
        <Switch
            size="md"
            color="dark.4"
            onLabel={<SunIcon size={16} color="var(--mantine-color-yellow-4)" />}
            offLabel={<MoonStarsIcon size={16} color="var(--mantine-color-blue-6)" />}
            checked={colorScheme === 'dark'}
            onChange={() => setColorScheme(colorScheme === 'dark' ? 'light' : 'dark')}
        />
    );

    return (<div>
        <Group justify="space-between" mt='4px' px={{ base: 'sm', sm: '1.5rem' }} wrap="nowrap">
            <Button
                variant={path === '/' ? 'light' : 'subtle'}
                onClick={() => nav('/')}
                px={{ base: 'xs', sm: 'md' }}
            >Better DynoQs</Button>

            {/* Desktop nav */}
            <Group justify="end" gap="md" visibleFrom="sm" wrap="nowrap">
                <Button
                    variant={path.includes('static-editor') ? 'light' : 'subtle'}
                    onClick={() => { nav('/static-editor') }}
                >Static Editor</Button>
                {isAuthenticated && <Button
                    variant={path.includes('dashboard') ? 'light' : 'subtle'}
                    onClick={() => nav('/dashboard')}
                >
                    Dashboard
                </Button>}
                <Button
                    variant={path.includes('login') ? 'light' : 'subtle'}
                    onClick={isAuthenticated ? signout : () => nav('/login')}
                >
                    {isAuthenticated ? 'Sign Out' : 'Login'}
                </Button>
                {colorSchemeSwitch}
            </Group>

            {/* Mobile burger */}
            <Group hiddenFrom="sm" gap="xs" wrap="nowrap">
                {colorSchemeSwitch}
                <Burger opened={drawerOpened} onClick={toggleDrawer} size="sm" aria-label="Toggle navigation" />
            </Group>
        </Group>

        <Drawer
            opened={drawerOpened}
            onClose={closeDrawer}
            size="75%"
            position="right"
            hiddenFrom="sm"
            title="Menu"
        >
            <Stack gap="sm">
                <Button
                    fullWidth
                    variant={path.includes('static-editor') ? 'light' : 'subtle'}
                    onClick={() => goTo('/static-editor')}
                >Static Editor</Button>
                {isAuthenticated && <Button
                    fullWidth
                    variant={path.includes('dashboard') ? 'light' : 'subtle'}
                    onClick={() => goTo('/dashboard')}
                >
                    Dashboard
                </Button>}
                <Button
                    fullWidth
                    variant={path.includes('login') ? 'light' : 'subtle'}
                    onClick={isAuthenticated ? () => { signout(); closeDrawer(); } : () => goTo('/login')}
                >
                    {isAuthenticated ? 'Sign Out' : 'Login'}
                </Button>
            </Stack>
        </Drawer>

        {systemMsgs.map((msg, i) => {
            return (<div className={styles.sysBanner} key={`system_msg-${i}`}>
                {msg}
                <ActionIcon size='1.2rem' variant="outline" ml='1rem' onClick={()=>{
                    setSysMsgs(prev => prev.filter(m => m !== msg))
                }}>
                    <XIcon size='0.8rem' />
                </ActionIcon>
            </div>)
        })}
    </div>)
}
