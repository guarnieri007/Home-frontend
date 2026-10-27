import { createContext, useContext, useEffect, useState } from 'react'
import { api, refreshTokens, tokenStorage, type User } from '../services/api'

interface AuthContextValue {
    user: User | null
    loading: boolean
    login: (email: string, password: string) => Promise<void>
    register: (data: { nm_user: string; email: string; password: string }) => Promise<void>
    logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null)
    // Começa carregando só se existe sessão salva para restaurar
    const [loading, setLoading] = useState(() => tokenStorage.getRefresh() !== null)

    useEffect(() => {
        if (!tokenStorage.getRefresh()) return
        refreshTokens()
            .then(() => api.me())
            .then(setUser)
            .catch(() => tokenStorage.clear())
            .finally(() => setLoading(false))
    }, [])

    const login = async (email: string, password: string) => {
        tokenStorage.save(await api.login(email, password))
        setUser(await api.me())
    }

    const register = async (data: { nm_user: string; email: string; password: string }) => {
        await api.createUser(data)
        await login(data.email, data.password)
    }

    const logout = async () => {
        const refresh = tokenStorage.getRefresh()
        tokenStorage.clear()
        setUser(null)
        if (refresh) await api.logout(refresh).catch(() => {})
    }

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
    const context = useContext(AuthContext)
    if (!context) throw new Error('useAuth precisa estar dentro de <AuthProvider>')
    return context
}
