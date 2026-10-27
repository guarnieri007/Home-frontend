import { useEffect, useRef } from "react"

interface SidebarDrawerProps {
    onClose: () => void
    children: React.ReactNode
}

// Em telas estreitas o menu abre como gaveta: <dialog> modal prende o foco
// e fecha com Esc ou tocando fora
const SidebarDrawer = ({ onClose, children }: SidebarDrawerProps) => {
    const dialogRef = useRef<HTMLDialogElement>(null)

    useEffect(() => {
        dialogRef.current?.showModal()
    }, [])

    return (
        <dialog
            ref={dialogRef}
            id="menu-perfis"
            className="sidebar-drawer"
            aria-label="Menu de perfis"
            onClose={onClose}
            onClick={(e) => { if (e.target === e.currentTarget) dialogRef.current?.close() }}
        >
            <div className="sidebar-drawer-conteudo">
                <button
                    type="button"
                    className="sidebar-drawer-fechar"
                    aria-label="Fechar menu"
                    onClick={() => dialogRef.current?.close()}
                >
                    ×
                </button>
                {children}
            </div>
        </dialog>
    )
}

export default SidebarDrawer
