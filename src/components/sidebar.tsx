import { useId, useState } from "react"
import { ApiError, type Profile } from "../services/api"
import { IconeLapis, IconeLixeira, IconeMais } from "./icones"

const NOME_MAX = 100

interface SidebarProps {
    profiles: Profile[]
    selecionado: number | null
    carregando: boolean
    erro: string | null
    onSelecionar: (cd_profile: number) => void
    onCriar: (nome: string) => Promise<void>
    onRenomear: (cd_profile: number, nome: string) => Promise<void>
    onRemover: (cd_profile: number) => Promise<void>
}

const mensagemErro = (error: unknown) =>
    error instanceof ApiError && error.code === 'VALIDATION_ERROR'
        ? `O nome precisa ter de 1 a ${NOME_MAX} caracteres`
        : error instanceof ApiError ? error.message : 'Erro inesperado, tente novamente'

// Campo de nome usado tanto para criar quanto para renomear:
// Enter salva, Esc cancela, sair do campo também salva
interface CampoNomeProps {
    inicial: string
    rotulo: string
    autoFocus?: boolean
    onSalvar: (nome: string) => Promise<void>
    onCancelar: () => void
}

const CampoNome = ({ inicial, rotulo, autoFocus, onSalvar, onCancelar }: CampoNomeProps) => {
    const [nome, setNome] = useState(inicial)
    const [erro, setErro] = useState<string | null>(null)
    const [salvando, setSalvando] = useState(false)
    const erroId = useId()

    const salvar = async () => {
        const limpo = nome.trim()
        if (salvando) return
        if (!limpo || limpo === inicial) return onCancelar()
        setSalvando(true)
        try {
            await onSalvar(limpo)
            setErro(null)
        } catch (error) {
            setErro(mensagemErro(error))
        } finally {
            setSalvando(false)
        }
    }

    return (
        <div className="sidebar-campo">
            <input
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                onBlur={salvar}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') { e.preventDefault(); salvar() }
                    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); setNome(inicial); onCancelar() }
                }}
                maxLength={NOME_MAX}
                aria-label={rotulo}
                aria-invalid={erro ? true : undefined}
                aria-describedby={erro ? erroId : undefined}
                autoFocus={autoFocus}
                disabled={salvando}
            />
            {erro && <span id={erroId} className="sidebar-erro" role="alert">{erro}</span>}
        </div>
    )
}

const Sidebar = ({ profiles, selecionado, carregando, erro, onSelecionar, onCriar, onRenomear, onRemover }: SidebarProps) => {
    const [modoEdicao, setModoEdicao] = useState(false)
    // Sem perfis não há o que editar
    const editando = modoEdicao && profiles.length > 0
    const [criando, setCriando] = useState(false)
    const [erroRemover, setErroRemover] = useState<string | null>(null)
    const tituloId = useId()

    const remover = async (profile: Profile) => {
        const ok = window.confirm(`Remover o perfil "${profile.nm_profile}"?\nTodos os favoritos dele também serão apagados.`)
        if (!ok) return
        setErroRemover(null)
        try {
            await onRemover(profile.cd_profile)
        } catch (error) {
            setErroRemover(mensagemErro(error))
        }
    }

    return (
        <nav className="sidebar" aria-labelledby={tituloId}>
            <div className="sidebar-topo">
                <h2 id={tituloId}>Perfis</h2>
                {profiles.length > 0 && (
                    <button
                        type="button"
                        className="sidebar-icone-botao"
                        aria-pressed={editando}
                        aria-label={editando ? 'Concluir edição dos perfis' : 'Editar perfis'}
                        title={editando ? 'Concluir' : 'Editar perfis'}
                        onClick={() => { setModoEdicao(!editando); setErroRemover(null) }}
                    >
                        {editando ? <span className="sidebar-concluir">OK</span> : <IconeLapis />}
                    </button>
                )}
            </div>

            {carregando && <p className="sidebar-aviso">Carregando…</p>}
            {erro && <p className="sidebar-erro" role="alert">{erro}</p>}
            {!carregando && !erro && profiles.length === 0 && (
                <p className="sidebar-aviso">Nenhum perfil ainda.</p>
            )}

            <ul className="sidebar-lista">
                {profiles.map((profile) => (
                    <li key={profile.cd_profile}>
                        {editando ? (
                            <div className="sidebar-item-edicao">
                                <CampoNome
                                    inicial={profile.nm_profile}
                                    rotulo={`Nome do perfil ${profile.nm_profile}`}
                                    onSalvar={(nome) => onRenomear(profile.cd_profile, nome)}
                                    onCancelar={() => {}}
                                />
                                <button
                                    type="button"
                                    className="sidebar-icone-botao sidebar-remover"
                                    aria-label={`Remover perfil ${profile.nm_profile}`}
                                    title="Remover perfil"
                                    onClick={() => remover(profile)}
                                >
                                    <IconeLixeira />
                                </button>
                            </div>
                        ) : (
                            <button
                                type="button"
                                className="sidebar-item"
                                aria-current={profile.cd_profile === selecionado ? 'page' : undefined}
                                onClick={() => onSelecionar(profile.cd_profile)}
                            >
                                {profile.nm_profile}
                            </button>
                        )}
                    </li>
                ))}
            </ul>

            {erroRemover && <p className="sidebar-erro" role="alert">{erroRemover}</p>}

            {criando ? (
                <CampoNome
                    inicial=""
                    rotulo="Nome do novo perfil"
                    autoFocus
                    onSalvar={async (nome) => { await onCriar(nome); setCriando(false) }}
                    onCancelar={() => setCriando(false)}
                />
            ) : (
                <button type="button" className="sidebar-adicionar" onClick={() => setCriando(true)}>
                    <IconeMais /> Novo perfil
                </button>
            )}
        </nav>
    )
}

export default Sidebar
