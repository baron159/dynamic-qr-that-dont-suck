import { useAuth } from "./contexts/auth.ctx";
import { Group, Button, Switch, useMantineColorScheme, ActionIcon } from "@mantine/core";
import { useLocation } from "wouter";
import { useState } from 'react';
import styles from './header.module.css';
import { SunIcon, MoonStarsIcon, XIcon } from '@phosphor-icons/react';


export default function Header() {
    const [path, nav] = useLocation();
    const { colorScheme, setColorScheme } = useMantineColorScheme();
    const { isAuthenticated, signout } = useAuth();
    const [systemMsgs, setSysMsgs] = useState<string[]>([
        'Desktop Browser is currently the recommended way of using the App, we are working out a few things in the Mobile view'
    ]);

    return (<div>
        <Group justify="space-between" mt='4px'>
            <Button
                variant={path === '/' ? 'light' : 'subtle'}
                onClick={() => nav('/')}
                ml={'3rem'}
            >Better DynoQs</Button>
            <Group justify="end" gap='2rem' mr='1.5rem'>
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
                <Switch
                    size="md"
                    color="dark.4"
                    onLabel={<SunIcon size={16} color="var(--mantine-color-yellow-4)" />}
                    offLabel={<MoonStarsIcon size={16} color="var(--mantine-color-blue-6)" />}
                    checked={colorScheme === 'dark'}
                    onChange={() => setColorScheme(colorScheme === 'dark' ? 'light' : 'dark')}
                />
            </Group>

        </Group>
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