// auth-context.tsx
import { createContext, useContext, useState, useEffect } from 'react';
import type React from 'react';

interface UserSignIn { email: string, password: string };
interface UserSignUp extends UserSignIn { name: string, phone?: string };

interface EntryResponse {
    token: string, user: UserFront
}

interface UserFront {
    id: string, name: string, email: string, phone?: string | null,
    stripeCustomerId: boolean, monthlySubscription: boolean
}

interface AuthContextType {
    isAuthenticated: boolean;
    signin: (data: UserSignIn) => Promise<string>;
    signup: (data: UserSignUp) => Promise<string>;
    getUser: () => Promise<UserFront>;
    updateUser: (data: Partial<UserFront>) => Promise<void>;
    signout: () => void;
    injectHeader: (req: Request) => void;
    user: UserFront | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState<UserFront | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const entryEndpoint = '/api/entry';
    const infoEndpoint = '/api/auth/info';

    useEffect(() => {
        // Replace this with your actual authentication check logic
        const tkn = localStorage.getItem('authToken');
        const prof = localStorage.getItem('userInfo');
        setToken(tkn);
        setIsAuthenticated(!!tkn);
        console.log('prof', typeof prof);
        if (prof === 'undefined' || !prof) setUser(null);
        else setUser(JSON.parse(prof || '{}'));
    }, []);

    useEffect(() => {
        if (token && !user) {
            getUser().then(aa => {
                console.log('accessor gotten', aa);
            })
        }
    }, [token, user])

    const signin = async (data: UserSignIn) => {
        const res = await fetch(entryEndpoint, {
            method: 'POST',
            body: JSON.stringify(data),
            headers: {
                'Content-Type': 'application/json',
            },
        });
        if (!res.ok) {
            const errbody = await res.json() as { error: string };
            throw Error(errbody.error);
        }
        const body = await res.json() as EntryResponse;
        localStorage.setItem('authToken', body.token);
        localStorage.setItem('userInfo', JSON.stringify(body.user));
        setToken(body.token);
        setUser(body.user);
        setIsAuthenticated(true);
        return body.user.id;
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
            const errbody = await res.json() as { error: string };
            throw Error(errbody.error);
        }
        const body = await res.json() as EntryResponse;
        localStorage.setItem('authToken', body.token);
        setToken(body.token);
        setIsAuthenticated(true);
        return body.user.id;
    }

    const getUser = async () => {
        const req = new Request(infoEndpoint);
        injectHeader(req);
        const res = await fetch(req);
        if (!res.ok) {
            throw Error('Failed to get user');
        }
        const body = await res.json() as { user: UserFront };
        setUser(body.user);
        return body.user;
    }

    const signout = () => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('userInfo');
        setToken(null);
        setUser(null);
        setIsAuthenticated(false);
    };

    const updateUser = async (data: Partial<UserFront>) => {
        // TODO: this endpoint is not yet implemented to handle this
        const req = new Request('/api/auth', {
            method: 'PUT',
            body: JSON.stringify(data),
        });
        injectHeader(req);
        const res = await fetch(req);
        if (!res.ok) {
            throw Error('Failed to update accessor');
        }
        const body = await res.json() as { user: UserFront };
        setUser(body.user);
    }

    const injectHeader = (req: Request) => {
        if (!!token) {
            req.headers.set('Authorization', `Bearer ${token}`);
        } else {
            throw Error('Attempt to inject header with no token');
        }
    }

    return (
        <AuthContext.Provider value={{ isAuthenticated, signin, signup, signout, injectHeader, user: user, getUser, updateUser }}>
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