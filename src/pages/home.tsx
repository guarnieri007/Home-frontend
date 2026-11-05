import { Favoritos, type FavoritoData } from "../components/favorito"
import type { User } from "../services/api"

type HomeProps = {
  loading: boolean
  user: User | null
  perfis: { selecionado: number | null; carregando: boolean }
  perfilAtual: { nm_profile: string } | undefined
  mensagemErroFavoritos: string | null
  favoritos: FavoritoData[] | null
  editing: boolean
  botaoAdicionar: React.ReactNode
  reordenar: (novaOrdem: FavoritoData[]) => void
  removerFavorito: (cd_favorite: number) => Promise<void>
  salvarFavorito: (cd_favorite: number, dados: any) => Promise<void>
  setPerfilEmEdicao: (perfil: number | null) => void
}

const Home = ({
  loading,
  user,
  perfis,
  perfilAtual,
  mensagemErroFavoritos,
  favoritos,
  editing,
  botaoAdicionar,
  reordenar,
  removerFavorito,
  salvarFavorito,
  setPerfilEmEdicao,
}: HomeProps) => {
  const selecionado = perfis.selecionado
  if (loading) return null
  if (!user) return <p className="aviso">Entre na sua conta para ver seus favoritos.</p>
  if (perfis.carregando) return <p className="aviso">Carregando…</p>
  if (!perfilAtual) return <p className="aviso">Você ainda não tem perfis. Crie um no menu para começar.</p>
  if (mensagemErroFavoritos) return <p className="aviso aviso-erro" role="alert">{mensagemErroFavoritos}</p>
  if (!favoritos) return <p className="aviso">Carregando favoritos…</p>
  if (favoritos.length === 0) {
    return (
      <>
        <p className="aviso">Nenhum favorito em “{perfilAtual.nm_profile}” ainda.</p>
        {botaoAdicionar}
      </>
    )
  }

  return (
    <>
      <div className="favoritos-acoes">
        {!editing && botaoAdicionar}
        <button type="button" className="botao-editar" onClick={() => setPerfilEmEdicao(editing ? null : selecionado)}>
          {editing ? 'Concluído' : 'Editar'}
        </button>
      </div>
      <Favoritos
        favoritos={favoritos}
        editing={editing}
        onReorder={reordenar}
        onDelete={removerFavorito}
        onSave={salvarFavorito}
      />
    </>
  )
}

export default Home;