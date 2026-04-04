import { useAuth } from "./contexts/auth.ctx";
import { Group, Button } from "@mantine/core";
import { useLocation } from "wouter";

export default function Header(){
    const [path, nav] = useLocation();
    const { isAuthenticated, signout } = useAuth();

    return(<Group justify="space-between" mt='4px'>
        <Button
            variant={path === '/' ? 'light' : 'subtle'}
            onClick={()=> nav('/')}
            ml={'3rem'}
        >Better DynoQs</Button>
        <Group justify="end" gap='2rem' mr='1.5rem'>
            {isAuthenticated && <Button 
                variant={path.includes('dashboard') ? 'light' : 'subtle'}
                onClick={()=> nav('/dashboard')}
            >
                Dashboard
            </Button>}
            <Button
                variant={path.includes('login') ? 'light' : 'subtle'}
                onClick={isAuthenticated ? signout : () => nav('/login')}
            >
                {isAuthenticated ? 'Sign Out' : 'Login'}
            </Button>
        </Group>
    </Group>)
}