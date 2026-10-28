import { useState } from "react"
import { useAuth } from "../auth/auth-context"
import AuthModal from "./auth-modal"
import { IconeMenu } from "./icones"

interface HeaderProps {
    // Só é passado em telas estreitas, onde o menu de perfis vira gaveta
    onAbrirMenu?: () => void
}

const Header = ({ onAbrirMenu }: HeaderProps) => {
    const { user, loading, logout } = useAuth()
    const [modalAberto, setModalAberto] = useState(false)

    return (
        <header id="topo" className="header">
            <div className="header-inicio">
                {onAbrirMenu && (
                    <button
                        type="button"
                        className="header-menu"
                        aria-label="Abrir menu de perfis"
                        aria-haspopup="dialog"
                        onClick={onAbrirMenu}
                    >
                        <IconeMenu />
                    </button>
                )}
                <span className="header-marca">
                    {/* Decorativo: o nome ao lado já identifica a marca */}
                    <img src="/logo.svg" alt="" className="header-logo" width="28" height="28" />
                    Home
                </span>
            </div>

            <nav className="header-acoes" aria-label="Conta">
                {loading ? null : user ? (
                    <>
                        <span className="header-usuario" title={user.nm_user}>
                            <span className="header-avatar" aria-hidden="true">
                                {user.nm_user.trim().charAt(0).toUpperCase()}
                            </span>
                            <span className="header-nome">{user.nm_user}</span>
                        </span>
                        <button type="button" className="header-botao" onClick={logout}>Sair</button>
                    </>
                ) : (
                    <button
                        type="button"
                        className="header-botao header-botao-destaque"
                        aria-haspopup="dialog"
                        onClick={() => setModalAberto(true)}
                    >
                        Entrar
                    </button>
                )}
            </nav>

            {modalAberto && <AuthModal onClose={() => setModalAberto(false)} />}
        </header>
    )
}

export default Header
