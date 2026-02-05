'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@/types/definitions';
import { authApi } from '@/lib/api';

interface AuthContextType {
    user: User | null;
    token: string | null;
    loading: boolean;
    login: (name: string, password: string) => Promise<void>;
    register: (name: string, email: string, password: string) => Promise<void>;
    logout: () => void;
    setAuth: (token: string, user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const storedToken = localStorage.getItem('token');
        if (storedToken) {
            setToken(storedToken);
            authApi.getMe()
                .then(user => {
                    setUser(user);
                })
                .catch(() => {
                    localStorage.removeItem('token');
                    setToken(null);
                })
                .finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, []);

    const login = async (name: string, password: string) => {
        const response = await authApi.login(name, password);
        localStorage.setItem('token', response.token);
        setToken(response.token);
        setUser(response.user);
    };

    const register = async (name: string, email: string, password: string) => {
        const response = await authApi.register(name, email, password);
        localStorage.setItem('token', response.token);
        setToken(response.token);
        setUser(response.user);
    };

    const logout = () => {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
    };

    const setAuth = (token: string, user: User) => {
        localStorage.setItem('token', token);
        setToken(token);
        setUser(user);
    };

    return (
        <AuthContext.Provider value={{ user, token, loading, login, register, logout, setAuth }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
