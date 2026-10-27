import { useEffect, useState } from 'react'
import './App.css'
import { useAuth } from './auth/auth-context'
import { Favoritos, type FavoritoData } from './components/favorito'
import FavoritoModal, { type FavoritoForm } from './components/favorito-modal'
import Header from './components/header'
import { IconeMais } from './components/icones'
import Sidebar from './components/sidebar'
import SidebarDrawer from './components/sidebar-drawer'
import { useMediaQuery } from './hooks/use-media-query'
import { useProfiles } from './hooks/use-profiles'
import { api } from './services/api'

function App() {
  const { user, loading } = useAuth()
  const perfis = useProfiles()
  const desktop = useMediaQuery('(min-width: 1024px)')
  const [menuAberto, setMenuAberto] = useState(false)

  // Favoritos guardam de qual perfil são: ao trocar de perfil, a lista antiga
  // deixa de valer e a tela mostra "carregando" até a nova chegar
  const [dadosFavoritos, setDadosFavoritos] = useState<{ cd_profile: number; lista: FavoritoData[] } | null>(null)
  const [erroFavoritos, setErroFavoritos] = useState<{ cd_profile: number; mensagem: string } | null>(null)
  const [perfilEmEdicao, setPerfilEmEdicao] = useState<number | null>(null)
  const [adicionando, setAdicionando] = useState(false)

  const selecionado = perfis.selecionado
  const perfilAtual = perfis.profiles.find((p) => p.cd_profile === selecionado)
  const favoritos = dadosFavoritos?.cd_profile === selecionado ? dadosFavoritos.lista : null
  const mensagemErroFavoritos = erroFavoritos?.cd_profile === selecionado ? erroFavoritos.mensagem : null
  // O modo de edição vale só para o perfil em que foi ligado
  const editing = selecionado !== null && perfilEmEdicao === selecionado

  // Busca os favoritos do perfil selecionado; sem perfil, não há favoritos
  useEffect(() => {
    if (selecionado === null) return
    let ativo = true
    api.listFavorites(selecionado)
      .then((lista) => {
        if (!ativo) return
        setDadosFavoritos({ cd_profile: selecionado, lista })
        setErroFavoritos(null)
      })
      .catch(() => ativo && setErroFavoritos({ cd_profile: selecionado, mensagem: 'Não foi possível carregar os favoritos' }))
    return () => { ativo = false }
  }, [selecionado])

  const alterarLista = (alterar: (lista: FavoritoData[]) => FavoritoData[]) =>
    setDadosFavoritos((d) => d && { ...d, lista: alterar(d.lista) })

  const removerFavorito = async (cd_favorite: number) => {
    await api.deleteFavorite(cd_favorite)
    alterarLista((lista) => lista.filter((f) => f.cd_favorite !== cd_favorite))
  }

  // Só envia o ícone se o usuário escolheu um novo
  const salvarFavorito = async (cd_favorite: number, dados: FavoritoForm) => {
    const atualizado = await api.updateFavorite(cd_favorite, dados)
    alterarLista((lista) => lista.map((f) => (f.cd_favorite === cd_favorite ? atualizado : f)))
  }

  // Sem ícone personalizado, o backend busca o favicon do site
  const criarFavorito = async (dados: FavoritoForm) => {
    if (selecionado === null) return
    const novo = await api.createFavorite({ cd_profile: selecionado, ...dados })
    alterarLista((lista) => [...lista, novo])
    setAdicionando(false)
  }

  // Atualiza a tela na hora; se o backend recusar, volta para a ordem anterior
  const reordenar = (novaOrdem: FavoritoData[]) => {
    if (selecionado === null || !favoritos) return
    const anterior = favoritos
    alterarLista(() => novaOrdem)
    api.reorderFavorites(selecionado, novaOrdem.map((f) => f.cd_favorite))
      .catch(() => {
        alterarLista(() => anterior)
        window.alert('Não foi possível salvar a nova ordem')
      })
  }

  const botaoAdicionar = (
    <button type="button" className="botao-editar botao-adicionar" onClick={() => setAdicionando(true)}>
      <IconeMais /> Adicionar
    </button>
  )

  const sidebar = user && (
    <Sidebar
      profiles={perfis.profiles}
      selecionado={perfis.selecionado}
      carregando={perfis.carregando}
      erro={perfis.erro}
      onSelecionar={(cd_profile) => { perfis.selecionar(cd_profile); setMenuAberto(false) }}
      onCriar={perfis.criar}
      onRenomear={perfis.renomear}
      onRemover={perfis.remover}
    />
  )

  const conteudo = () => {
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

  return (
    <>
      <Header onAbrirMenu={user && !desktop ? () => setMenuAberto(true) : undefined} />

      <div className="layout">
        {desktop && sidebar && <aside className="layout-sidebar">{sidebar}</aside>}
        {!desktop && menuAberto && sidebar && (
          <SidebarDrawer onClose={() => setMenuAberto(false)}>{sidebar}</SidebarDrawer>
        )}

        <main className="App layout-conteudo">
          <section id="center">
            {perfilAtual && <h1 className="perfil-titulo">{perfilAtual.nm_profile}</h1>}
            {conteudo()}
          </section>

          {adicionando && <FavoritoModal onSave={criarFavorito} onClose={() => setAdicionando(false)} />}
        </main>
      </div>
    </>
  )
}

export default App
