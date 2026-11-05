import { useNavigate, useSearchParams } from 'react-router-dom'
import { api } from '../services/api'
import { useEffect, useRef, useState } from 'react'

const ForgotPassword = () => {
    const dialogRef = useRef<HTMLDialogElement>(null)
    const [params] = useSearchParams()
    const token = params.get('token') || ''
    const [validation, setValidation] = useState<boolean | null>(null)
    const [erro, setErro] = useState(false)
    const [loading, setLoading] = useState(true)

    const navigate = useNavigate()

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const formData = new FormData(e.currentTarget)
        const newPassword = formData.get('newPassword') as string

        try {
            await api.resetPassword(token, newPassword)
            setValidation(null)
            navigate('/')
        } catch (error) {
            setErro(true)
        }
    }

    useEffect(() => {
        dialogRef.current?.showModal()
        // showModal() foca o primeiro elemento (o botão fechar); o email é mais útil
        dialogRef.current?.querySelector<HTMLInputElement>('input[name=email]')?.focus()
    }, [])

    useEffect(() => {
        setLoading(true)
        if (!token) return
        let ativo = true

        api.checkResetToken(token)
            .then((resultado) => ativo && setValidation(resultado.message))
            .catch(() => {
                ativo && setErro(true)
            })
            .finally(() => {
                ativo && setLoading(false)
            })

        return () => { ativo = false }
    }, [token])

    if (!token) {
        return (
            <div className="forgot-password">
                <h1>Esqueci minha senha</h1>
                <p className="aviso aviso-erro">Token de redefinição de senha não fornecido.</p>
            </div>
        )
    }

    return (
        <div className="forgot-password">
            <h1>Esqueci minha senha</h1>

            {validation === false || erro ? (<p className="aviso aviso-erro">Não foi possível validar o token.</p>) : (

                <dialog
                    ref={dialogRef}
                    className="auth-modal"
                    aria-labelledby={`Esqueci minha senha-titulo`}
                    >

                    <div className="auth-modal-topo">
                        <form onSubmit={handleSubmit}>
                            <label htmlFor="newPassword">Nova senha:</label>
                            <input type="password" id="newPassword" name="newPassword" required />
                            <button type="submit">Redefinir senha</button>
                        </form>
                    </div>
                </dialog>
            )}


            {loading && <p className="aviso">Validando token…</p>}
        </div>
    )
}

export default ForgotPassword