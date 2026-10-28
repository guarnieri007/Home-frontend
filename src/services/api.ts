const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3333'
const REFRESH_KEY = 'home:refresh_token'

export interface ApiErrorDetail {
    field: string
    message: string
}

// Espelha o formato de erro do backend: { error: { code, message, details } }
export class ApiError extends Error {
    readonly status: number
    readonly code: string
    readonly details: ApiErrorDetail[]

    constructor(status: number, code: string, message: string, details: ApiErrorDetail[] = []) {
        super(message)
        this.status = status
        this.code = code
        this.details = details
    }
}

export interface Tokens {
    access_token: string
    refresh_token: string
    expires_in: number
}

export interface User {
    cd_user: number
    nm_user: string
    email: string
    created_at: string
    last_modified: string
}

export interface Profile {
    cd_profile: number
    cd_user: number
    nm_profile: string
    created_at: string
    last_modified: string
}

export interface Favorite {
    cd_favorite: number
    cd_profile: number
    url: string
    descricao: string
    icone: string
    sort_order: number
    created_at: string
    last_modified: string
}

// Sem ícone, o backend busca o favicon do site
export interface NewFavorite {
    cd_profile: number
    url: string
    descricao: string
    icone?: string
}

export type FavoriteUpdate = Partial<Pick<Favorite, 'cd_profile' | 'url' | 'descricao' | 'icone'>>

// Access token só em memória; o refresh token fica salvo para manter a sessão ao recarregar
let accessToken: string | null = null

export const tokenStorage = {
    getRefresh: () => {
        try { return localStorage.getItem(REFRESH_KEY) } catch { return null }
    },
    save: (tokens: Tokens) => {
        accessToken = tokens.access_token
        try { localStorage.setItem(REFRESH_KEY, tokens.refresh_token) } catch { /* modo privado */ }
    },
    clear: () => {
        accessToken = null
        try { localStorage.removeItem(REFRESH_KEY) } catch { /* modo privado */ }
    },
}

async function send<T>(method: string, path: string, body?: unknown, auth = false): Promise<T> {
    let response: Response
    try {
        response = await fetch(`${API_URL}${path}`, {
            method,
            headers: {
                ...(body !== undefined && { 'Content-Type': 'application/json' }),
                ...(auth && accessToken && { Authorization: `Bearer ${accessToken}` }),
            },
            body: body !== undefined ? JSON.stringify(body) : undefined,
        })
    } catch {
        throw new ApiError(0, 'NETWORK_ERROR', 'Não foi possível conectar ao servidor')
    }

    if (response.status === 204) return undefined as T
    const data = await response.json().catch(() => null)
    if (!response.ok) {
        const error = data?.error
        throw new ApiError(response.status, error?.code ?? 'UNKNOWN', error?.message ?? 'Erro inesperado', error?.details)
    }
    return data as T
}

// Várias chamadas ao mesmo tempo com token expirado disparam um único refresh
let refreshing: Promise<Tokens> | null = null

export function refreshTokens(): Promise<Tokens> {
    const refresh_token = tokenStorage.getRefresh()
    if (!refresh_token) return Promise.reject(new ApiError(401, 'INVALID_REFRESH_TOKEN', 'Sessão expirada'))

    refreshing ??= send<Tokens>('POST', '/auth/refresh', { refresh_token })
        .then((tokens) => { tokenStorage.save(tokens); return tokens })
        .catch((error) => { tokenStorage.clear(); throw error })
        .finally(() => { refreshing = null })
    return refreshing
}

// Rotas protegidas: se o access token (2 min) expirou, renova e tenta de novo
async function authed<T>(method: string, path: string, body?: unknown): Promise<T> {
    if (!accessToken) await refreshTokens()
    try {
        return await send<T>(method, path, body, true)
    } catch (error) {
        if (error instanceof ApiError && error.code === 'TOKEN_EXPIRED') {
            await refreshTokens()
            return send<T>(method, path, body, true)
        }
        throw error
    }
}

export const api = {
    login: (email: string, password: string) => send<Tokens>('POST', '/auth/login', { email, password }),
    logout: (refresh_token: string) => send<void>('POST', '/auth/logout', { refresh_token }),
    createUser: (data: { nm_user: string; email: string; password: string }) => send<User>('POST', '/users', data),
    me: () => authed<User>('GET', '/users/me'),

    listProfiles: () => authed<Profile[]>('GET', '/profiles'),
    createProfile: (nm_profile: string) => authed<Profile>('POST', '/profiles', { nm_profile }),
    renameProfile: (cd_profile: number, nm_profile: string) =>
        authed<Profile>('PATCH', `/profiles/${cd_profile}`, { nm_profile }),
    deleteProfile: (cd_profile: number) => authed<void>('DELETE', `/profiles/${cd_profile}`),

    listFavorites: (cd_profile: number) => authed<Favorite[]>('GET', `/favorites?cd_profile=${cd_profile}`),
    createFavorite: (data: NewFavorite) => authed<Favorite>('POST', '/favorites', data),
    reorderFavorites: (cd_profile: number, cd_favorites: number[]) =>
        authed<Favorite[]>('PUT', '/favorites/order', { cd_profile, cd_favorites }),
    updateFavorite: (cd_favorite: number, data: FavoriteUpdate) =>
        authed<Favorite>('PATCH', `/favorites/${cd_favorite}`, data),
    deleteFavorite: (cd_favorite: number) => authed<void>('DELETE', `/favorites/${cd_favorite}`),
}
