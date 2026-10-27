import { useEffect, useId, useRef, useState } from "react"
import { useAuth } from "../auth/auth-context"
import { ApiError } from "../services/api"

type Modo = 'login' | 'cadastro'
type Campo = 'nm_user' | 'email' | 'password'

interface AuthModalProps {
    onClose: () => void
}

// Mensagens em português para os campos que o backend rejeitar na validação
const mensagensCampo: Record<Campo, string> = {
    nm_user: 'Informe seu nome completo (até 100 caracteres)',
    email: 'Informe um email válido',
    password: 'A senha precisa ter entre 8 e 128 caracteres',
}

const mensagensErro: Record<string, string> = {
    INVALID_CREDENTIALS: 'Email ou senha inválidos',
    EMAIL_ALREADY_IN_USE: 'Este email já está cadastrado',
    TOO_MANY_REQUESTS: 'Muitas tentativas. Aguarde um minuto e tente de novo',
    NETWORK_ERROR: 'Não foi possível conectar ao servidor',
}

const AuthModal = ({ onClose }: AuthModalProps) => {
    const dialogRef = useRef<HTMLDialogElement>(null)
    const { login, register } = useAuth()
    const id = useId()

    const [modo, setModo] = useState<Modo>('login')
    const [form, setForm] = useState({ nm_user: '', email: '', password: '' })
    const [erro, setErro] = useState<string | null>(null)
    const [errosCampo, setErrosCampo] = useState<Partial<Record<Campo, string>>>({})
    const [enviando, setEnviando] = useState(false)

    useEffect(() => {
        dialogRef.current?.showModal()
        // showModal() foca o primeiro elemento (o botão fechar); o email é mais útil
        dialogRef.current?.querySelector<HTMLInputElement>('input[name=email]')?.focus()
    }, [])

    const fechar = () => dialogRef.current?.close()

    const trocarModo = (novo: Modo) => {
        setModo(novo)
        setErro(null)
        setErrosCampo({})
        setForm((f) => ({ ...f, password: '' }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setEnviando(true)
        setErro(null)
        setErrosCampo({})
        try {
            if (modo === 'login') await login(form.email, form.password)
            else await register(form)
            fechar()
        } catch (error) {
            if (!(error instanceof ApiError)) {
                setErro('Erro inesperado, tente novamente')
            } else if (error.code === 'VALIDATION_ERROR') {
                // "body.email" -> "email"
                const campos: Partial<Record<Campo, string>> = {}
                for (const d of error.details) {
                    const campo = d.field.split('.').pop() as Campo
                    if (campo in mensagensCampo) campos[campo] = mensagensCampo[campo]
                }
                setErrosCampo(campos)
                setErro('Confira os campos destacados')
            } else {
                setErro(mensagensErro[error.code] ?? error.message)
            }
        } finally {
            setEnviando(false)
        }
    }

    const campo = (nome: Campo) => ({
        id: `${id}-${nome}`,
        name: nome,
        value: form[nome],
        onChange: (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [nome]: e.target.value }),
        'aria-invalid': errosCampo[nome] ? true : undefined,
        'aria-describedby': errosCampo[nome]
            ? `${id}-${nome}-erro`
            : nome === 'password' && modo === 'cadastro' ? `${id}-password-dica` : undefined,
    })

    const erroCampo = (nome: Campo) =>
        errosCampo[nome] && <span id={`${id}-${nome}-erro`} className="auth-campo-erro">{errosCampo[nome]}</span>

    const titulo = modo === 'login' ? 'Entrar' : 'Criar conta'

    return (
        <dialog
            ref={dialogRef}
            className="auth-modal"
            aria-labelledby={`${id}-titulo`}
            onClose={onClose}
            // Clique fora do formulário (no backdrop) fecha o modal
            onClick={(e) => { if (e.target === e.currentTarget) fechar() }}
        >
            <form onSubmit={handleSubmit}>
                <div className="auth-modal-topo">
                    <h2 id={`${id}-titulo`}>{titulo}</h2>
                    <button type="button" className="auth-fechar" onClick={fechar} aria-label="Fechar">×</button>
                </div>

                {modo === 'cadastro' && (
                    <label htmlFor={`${id}-nm_user`}>
                        Nome completo
                        <input {...campo('nm_user')} required maxLength={100} autoComplete="name" autoFocus />
                        {erroCampo('nm_user')}
                    </label>
                )}

                <label htmlFor={`${id}-email`}>
                    Email
                    <input
                        {...campo('email')}
                        type="email"
                        required
                        maxLength={254}
                        autoComplete="email"
                        inputMode="email"
                        autoFocus={modo === 'login'}
                    />
                    {erroCampo('email')}
                </label>

                <label htmlFor={`${id}-password`}>
                    Senha
                    <input
                        {...campo('password')}
                        type="password"
                        required
                        minLength={modo === 'cadastro' ? 8 : undefined}
                        maxLength={128}
                        autoComplete={modo === 'login' ? 'current-password' : 'new-password'}
                    />
                    {modo === 'cadastro' && !errosCampo.password && <small id={`${id}-password-dica`}>Mínimo de 8 caracteres</small>}
                    {erroCampo('password')}
                </label>

                {erro && <p className="auth-erro" role="alert">{erro}</p>}

                <button type="submit" className="auth-enviar" disabled={enviando} aria-busy={enviando}>
                    {enviando ? 'Aguarde…' : titulo}
                </button>

                <p className="auth-alternar">
                    {modo === 'login' ? 'Ainda não tem conta?' : 'Já tem conta?'}{' '}
                    <button type="button" onClick={() => trocarModo(modo === 'login' ? 'cadastro' : 'login')}>
                        {modo === 'login' ? 'Criar usuário' : 'Entrar'}
                    </button>
                </p>
            </form>
        </dialog>
    )
}

export default AuthModal
