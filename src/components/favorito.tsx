import { useState } from "react"
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    type DragEndEvent,
} from "@dnd-kit/core"
import {
    SortableContext,
    arrayMove,
    rectSortingStrategy,
    sortableKeyboardCoordinates,
    useSortable,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import Background from "./background"
import FavoritoModal, { type FavoritoForm } from "./favorito-modal"

import type { Favorite } from "../services/api"

export type FavoritoData = Favorite

interface FavoritoProps {
    favorito: FavoritoData
    index: number
    editing?: boolean
    onDelete?: (id: number) => void
    onEdit?: (favorito: FavoritoData) => void
}

interface FavoritosProps {
    favoritos: FavoritoData[]
    editing?: boolean
    onReorder: (favoritos: FavoritoData[]) => void
    onDelete: (cd_favorite: number) => Promise<void>
    onSave: (cd_favorite: number, dados: FavoritoForm) => Promise<void>
}

const styles_descricao: React.CSSProperties = {
    fontSize: '18px',
    textAlign: 'center',
    marginTop: '12px',
    color: '#dfdfdf',
    textDecoration: 'none',
    fontFamily: 'Akachen',
}

const styles_background: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'initial',
    width: '100%',
}

const styles_favorito: React.CSSProperties = {
    boxSizing: 'border-box',
    display: 'block',
    flexDirection: 'column',
    alignItems: 'center',
    width: '90px',
    height: '120px',
}

const styles_icone: React.CSSProperties = {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
}

// Impede que Enter/Espaço no botão ou no link iniciem o arraste pelo teclado
const stopKeyDown = (e: React.KeyboardEvent) => e.stopPropagation()

export const Favorito = ({ favorito, index, editing = false, onDelete, onEdit }: FavoritoProps) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: favorito.cd_favorite,
        disabled: !editing,
    })

    // O transform do dnd-kit fica no elemento externo e a animação de balançar no interno,
    // senão a animação sobrescreveria o transform do arraste
    const style: React.CSSProperties = {
        ...styles_favorito,
        transform: CSS.Translate.toString(transform),
        transition,
        zIndex: isDragging ? 10 : undefined,
        touchAction: editing ? 'none' : undefined,
        cursor: editing ? 'grab' : undefined,
    }

    // Atraso diferente por posição para os ícones não balançarem sincronizados
    const animationDelay = `-${(index % 5) * 0.07}s`

    const handleClick = (e: React.MouseEvent) => {
        if (!editing) return
        e.preventDefault()
        onEdit?.(favorito)
    }

    return (
        <div ref={setNodeRef} style={style} {...(editing ? { ...attributes, ...listeners } : {})}>
            <div
                className={`favorito${editing ? ' editing' : ''}${isDragging ? ' dragging' : ''}`}
                style={{ animationDelay }}
            >
                {editing && (
                    <button
                        type="button"
                        className="favorito-delete"
                        aria-label={`Remover ${favorito.descricao}`}
                        onClick={() => onDelete?.(favorito.cd_favorite)}
                        onKeyDown={stopKeyDown}
                    >
                        ×
                    </button>
                )}
                {/* Sem href no modo de edição: após um arraste o dnd-kit bloqueia o onClick,
                    então o preventDefault não roda e o navegador abriria o link */}
                <a
                    href={editing ? undefined : favorito.url}
                    target="_blank"
                    rel="noreferrer"
                    draggable={false}
                    onClick={handleClick}
                    onKeyDown={editing ? stopKeyDown : undefined}
                    style={{ textDecoration: 'none' }}
                >
                    <Background
                        inside={<img src={favorito.icone} alt="" draggable={false} style={styles_icone} />}
                        styles={styles_background}
                    />
                    {favorito.descricao && <div className="favorito-descricao" style={styles_descricao}>
                        {favorito.descricao}
                    </div>}
                </a>
            </div>
        </div>
    )
}

export const Favoritos = ({ favoritos, editing = false, onReorder, onDelete, onSave }: FavoritosProps) => {
    const [favoritoEmEdicao, setFavoritoEmEdicao] = useState<FavoritoData | null>(null)

    const sensors = useSensors(
        // distance: só começa a arrastar depois de mover 8px, assim o clique continua abrindo o modal
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
    )

    const handleDragEnd = ({ active, over }: DragEndEvent) => {
        if (!over || active.id === over.id) return
        const from = favoritos.findIndex((f) => f.cd_favorite === active.id)
        const to = favoritos.findIndex((f) => f.cd_favorite === over.id)
        onReorder(arrayMove(favoritos, from, to))
    }

    const handleDelete = (id: number) => {
        onDelete(id).catch(() => window.alert('Não foi possível remover o favorito'))
    }

    // O modal mostra o erro e continua aberto se o backend recusar
    const handleSave = async (dados: FavoritoForm) => {
        if (!favoritoEmEdicao) return
        await onSave(favoritoEmEdicao.cd_favorite, dados)
        setFavoritoEmEdicao(null)
    }

    return (
        <>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={favoritos.map((f) => f.cd_favorite)} strategy={rectSortingStrategy}>
                    <div className={`favoritos-container${editing ? ' editing' : ''}`}>
                        {favoritos.map((favorito, index) => (
                            <Favorito
                                key={favorito.cd_favorite}
                                favorito={favorito}
                                index={index}
                                editing={editing}
                                onDelete={handleDelete}
                                onEdit={setFavoritoEmEdicao}
                            />
                        ))}
                    </div>
                </SortableContext>
            </DndContext>

            {favoritoEmEdicao && (
                <FavoritoModal
                    key={favoritoEmEdicao.cd_favorite}
                    favorito={favoritoEmEdicao}
                    onSave={handleSave}
                    onClose={() => setFavoritoEmEdicao(null)}
                />
            )}
        </>
    )
}
