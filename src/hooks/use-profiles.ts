import { useEffect, useState } from 'react'
import { useAuth } from '../auth/auth-context'
import { api, type Profile } from '../services/api'

const SELECTED_KEY = 'firehome:perfil_selecionado'

const lerSelecionado = () => {
    try { return Number(localStorage.getItem(SELECTED_KEY)) || null } catch { return null }
}

const salvarSelecionado = (cd_profile: number | null) => {
    try {
        if (cd_profile) localStorage.setItem(SELECTED_KEY, String(cd_profile))
        else localStorage.removeItem(SELECTED_KEY)
    } catch { /* modo privado */ }
}

interface Dados {
    cd_user: number
    profiles: Profile[]
    selecionado: number | null
}

export function useProfiles() {
    const { user } = useAuth()
    // Os dados guardam de qual usuário são: ao trocar de conta ou sair,
    // os perfis antigos deixam de valer sem precisar limpar o estado
    const [dados, setDados] = useState<Dados | null>(null)
    const [erro, setErro] = useState<{ cd_user: number; mensagem: string } | null>(null)

    useEffect(() => {
        if (!user) return
        let ativo = true
        api.listProfiles()
            .then((profiles) => {
                if (!ativo) return
                const salvo = lerSelecionado()
                const selecionado = profiles.some((p) => p.cd_profile === salvo) ? salvo : profiles[0]?.cd_profile ?? null
                setDados({ cd_user: user.cd_user, profiles, selecionado })
                setErro(null)
            })
            .catch(() => ativo && setErro({ cd_user: user.cd_user, mensagem: 'Não foi possível carregar os perfis' }))
        return () => { ativo = false }
    }, [user])

    const atual = user && dados?.cd_user === user.cd_user ? dados : null
    const profiles = atual?.profiles ?? []
    const selecionado = atual?.selecionado ?? null
    const mensagemErro = user && erro?.cd_user === user.cd_user ? erro.mensagem : null

    const selecionar = (cd_profile: number | null) => {
        setDados((d) => d && { ...d, selecionado: cd_profile })
        salvarSelecionado(cd_profile)
    }

    const criar = async (nm_profile: string) => {
        const novo = await api.createProfile(nm_profile)
        setDados((d) => d && { ...d, profiles: [...d.profiles, novo], selecionado: novo.cd_profile })
        salvarSelecionado(novo.cd_profile)
    }

    const renomear = async (cd_profile: number, nm_profile: string) => {
        const atualizado = await api.renameProfile(cd_profile, nm_profile)
        setDados((d) => d && { ...d, profiles: d.profiles.map((p) => (p.cd_profile === cd_profile ? atualizado : p)) })
    }

    const remover = async (cd_profile: number) => {
        await api.deleteProfile(cd_profile)
        const restantes = profiles.filter((p) => p.cd_profile !== cd_profile)
        setDados((d) => d && { ...d, profiles: restantes })
        if (selecionado === cd_profile) selecionar(restantes[0]?.cd_profile ?? null)
    }

    return {
        profiles,
        selecionado,
        selecionar,
        carregando: !!user && !atual && !mensagemErro,
        erro: mensagemErro,
        criar,
        renomear,
        remover,
    }
}
