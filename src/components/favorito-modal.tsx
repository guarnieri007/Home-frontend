import { useEffect, useId, useRef, useState } from "react"
import Background from "./background"
import type { FavoritoData } from "./favorito"
import { ApiError } from "../services/api"
import { imagemParaIcone, normalizarUrl } from "../utils/imagem"

export interface FavoritoForm {
    url: string
    descricao: string
    // Só vem preenchido quando o usuário escolheu uma imagem
    icone?: string
}

interface FavoritoModalProps {
    // Sem favorito = modo de criação
    favorito?: FavoritoData
    onSave: (dados: FavoritoForm) => Promise<void>
    onClose: () => void
}

const styles_icone: React.CSSProperties = {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
}

const FavoritoModal = ({ favorito, onSave, onClose }: FavoritoModalProps) => {
    const dialogRef = useRef<HTMLDialogElement>(null)
    const arquivoRef = useRef<HTMLInputElement>(null)
    const nomeRef = useRef<HTMLInputElement>(null)
    const id = useId()
    const criando = !favorito

    const [url, setUrl] = useState(favorito?.url ?? '')
    const [descricao, setDescricao] = useState(favorito?.descricao ?? '')
    // Ícone escolhido nesta abertura do modal; null = manter o atual (ou buscar o do site, ao criar)
    const [iconeNovo, setIconeNovo] = useState<string | null>(null)
    const [erro, setErro] = useState<string | null>(null)
    const [salvando, setSalvando] = useState(false)

    useEffect(() => {
        dialogRef.current?.showModal()
        // showModal() foca o primeiro elemento (o ícone); ao criar, o campo Nome é mais útil
        if (!favorito) nomeRef.current?.focus()
    }, [favorito])

    const fechar = () => dialogRef.current?.close()
    const iconeExibido = iconeNovo ?? favorito?.icone

    const handleIcone = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        e.target.value = '' // permite escolher o mesmo arquivo de novo
        if (!file) return
        try {
            setIconeNovo(await imagemParaIcone(file))
            setErro(null)
        } catch (error) {
            setErro(error instanceof Error ? error.message : 'Não foi possível usar essa imagem')
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        const urlFinal = normalizarUrl(url)
        try {
            new URL(urlFinal)
        } catch {
            setErro('Informe uma URL válida, por exemplo: github.com')
            return
        }

        setSalvando(true)
        setErro(null)
        try {
            await onSave({ url: urlFinal, descricao: descricao.trim(), ...(iconeNovo && { icone: iconeNovo }) })
        } catch (error) {
            setErro(
                error instanceof ApiError && error.code === 'VALIDATION_ERROR'
                    ? 'Confira os campos: o nome é obrigatório e a URL precisa ser válida (ex.: https://site.com)'
                    : error instanceof ApiError ? error.message : 'Não foi possível salvar',
            )
        } finally {
            setSalvando(false)
        }
    }

    return (
        <dialog
            ref={dialogRef}
            className="favorito-modal"
            aria-labelledby={`${id}-titulo`}
            onClose={onClose}
            // Clique fora do formulário (no backdrop) fecha o modal
            onClick={(e) => { if (e.target === e.currentTarget) fechar() }}
        >
            <form onSubmit={handleSubmit}>
                <h2 id={`${id}-titulo`}>{criando ? 'Novo favorito' : 'Editar favorito'}</h2>

                <div className="favorito-modal-icone">
                    <button
                        type="button"
                        className="favorito-modal-preview"
                        onClick={() => arquivoRef.current?.click()}
                        aria-describedby={`${id}-icone-dica`}
                    >
                        {iconeExibido ? (
                            <Background inside={<img src={iconeExibido} alt="" style={styles_icone} />} />
                        ) : (
                            <span className="favorito-modal-auto" aria-hidden="true">Auto</span>
                        )}
                        <span className="sr-only">{iconeExibido ? 'Trocar ícone' : 'Escolher ícone personalizado'}</span>
                    </button>
                    <input ref={arquivoRef} type="file" accept="image/*" hidden onChange={handleIcone} />
                    <small id={`${id}-icone-dica`}>
                        {iconeExibido
                            ? 'Clique no ícone para trocar'
                            : 'Sem imagem, o ícone do site é buscado ao salvar. Clique para enviar uma.'}
                    </small>
                    {criando && iconeNovo && (
                        <button type="button" className="favorito-modal-link" onClick={() => setIconeNovo(null)}>
                            Usar o ícone do site
                        </button>
                    )}
                </div>

                <label>
                    Nome
                    <input
                        ref={nomeRef}
                        required
                        maxLength={255}
                        value={descricao}
                        onChange={(e) => setDescricao(e.target.value)}
                    />
                </label>

                <label>
                    URL
                    <input
                        type="text"
                        inputMode="url"
                        autoComplete="url"
                        autoCapitalize="none"
                        spellCheck={false}
                        required
                        maxLength={2048}
                        placeholder="github.com"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                    />
                </label>

                {erro && <p className="favorito-modal-erro" role="alert">{erro}</p>}

                <div className="favorito-modal-acoes">
                    <button type="button" onClick={fechar}>Cancelar</button>
                    <button type="submit" disabled={salvando} aria-busy={salvando}>
                        {salvando ? (criando && !iconeNovo ? 'Buscando ícone…' : 'Salvando…') : 'Salvar'}
                    </button>
                </div>
            </form>
        </dialog>
    )
}

export default FavoritoModal
