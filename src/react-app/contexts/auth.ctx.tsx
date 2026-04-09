// auth-context.tsx
import { createContext, useContext, useState, useEffect } from 'react';
import type React from 'react';
import { notifications } from '@mantine/notifications';
import { TryExtractingError } from '../util/response.error.extract';

interface UserSignIn { email: string, password: string };
interface UserSignUp extends UserSignIn { name: string, phone?: string };

interface EntryResponse {
    token: string, user: { id: string }
}

const TKN_KEY = 'authToken' as const;
const UID_KEY = 'userId' as const;


interface AuthContextType {
    isAuthenticated: boolean;
    uid: string | null;
    signin: (data: UserSignIn) => Promise<string>;
    signup: (data: UserSignUp) => Promise<string>;
    signout: () => void;
    injectHeader: (req: Request) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const entryEndpoint = '/api/entry';

    useEffect(() => {
        const tkn = localStorage.getItem(TKN_KEY);
        const uid = localStorage.getItem(UID_KEY);
        setToken(tkn);
        setUserId(uid);
        setIsAuthenticated(!!tkn);
    }, []);

    const signin = async (data: UserSignIn) => {
        try {
            const res = await fetch(entryEndpoint, {
                method: 'POST',
                body: JSON.stringify(data),
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            if (!res.ok) {
                const message = await TryExtractingError(res);
                notifications.show({
                    title: 'Ummm',
                    message,
                    withBorder: true,
                    color: 'red',
                });
                throw Error(message);
            }
            const body = await res.json() as EntryResponse;
            localStorage.setItem(TKN_KEY, body.token);
            localStorage.setItem(UID_KEY, body.user.id);
            setToken(body.token);
            setUserId(body.user.id);
            setIsAuthenticated(true);
            notifications.show({
                message: 'Welcome Back!',
                withBorder: true
            });
            return body.user.id;
        } catch (error) {
            console.error(error);
            notifications.show({
                title: 'Wierd issue with entry function',
                message: `Issue with sign-in: ${error}`,
                withBorder: true,
                color: 'red'
            })
            return '';
        }
    };

    const signup = async (data: UserSignUp) => {
        const res = await fetch(entryEndpoint, {
            method: 'POST',
            body: JSON.stringify(data),
            headers: {
                'Content-Type': 'application/json',
            },
        });
        if (!res.ok) {
            const message = await TryExtractingError(res);
            notifications.show({
                title: 'Ummm',
                message,
                withBorder: true,
            });
            throw Error(message);
        }
        const body = await res.json() as EntryResponse;
        localStorage.setItem(TKN_KEY, body.token);
        localStorage.setItem(UID_KEY, body.user.id);
        setToken(body.token);
        setUserId(body.user.id);
        setIsAuthenticated(true);
        notifications.show({
            title: 'Welcome to the Club',
            message: 'Your account has been created',
            withBorder: true
        });
        return body.user.id;
    };

    const signout = () => {
        localStorage.removeItem(TKN_KEY);
        localStorage.removeItem(UID_KEY);
        setToken(null);
        setUserId(null);
        setIsAuthenticated(false);
        notifications.show({
            title: 'Signed out',
            message: 'See you next time',
            withBorder: true,
            color: 'yellow'
        });
    };

    const injectHeader = (req: Request) => {
        if (!!token) {
            req.headers.set('Authorization', `Bearer ${token}`);
        } else {
            throw Error('Attempt to inject header with no token');
        }
    }

    return (
        <AuthContext.Provider value={{ isAuthenticated, uid: userId, signin, signup, signout, injectHeader }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export type { AuthContextType };
export { AuthContext };