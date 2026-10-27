// Mesmo limite do backend (ICONE_DATA_URL_MAX em favorites.schemas.ts)
export const ICONE_DATA_URL_MAX = 150_000

const LADO_MAX = 192 // o ícone aparece com ~90px; 192px cobre telas de alta densidade
const ARQUIVO_MAX = 10 * 1024 * 1024

function carregar(file: File): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const url = URL.createObjectURL(file)
        const img = new Image()
        img.onload = () => { URL.revokeObjectURL(url); resolve(img) }
        img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Não foi possível ler a imagem')) }
        img.src = url
    })
}

// Reduz a imagem para no máximo 192px e converte para data URL (WebP, ou PNG
// nos navegadores sem WebP), tentando qualidades menores até caber no limite
export async function imagemParaIcone(file: File): Promise<string> {
    if (!file.type.startsWith('image/')) throw new Error('Escolha um arquivo de imagem')
    if (file.size > ARQUIVO_MAX) throw new Error('Imagem muito grande (máximo 10 MB)')

    const img = await carregar(file)
    const escala = Math.min(1, LADO_MAX / Math.max(img.naturalWidth, img.naturalHeight))
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(img.naturalWidth * escala))
    canvas.height = Math.max(1, Math.round(img.naturalHeight * escala))
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Não foi possível processar a imagem')
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

    for (const qualidade of [0.92, 0.8, 0.6]) {
        const dataUrl = canvas.toDataURL('image/webp', qualidade)
        if (dataUrl.length <= ICONE_DATA_URL_MAX) return dataUrl
    }
    throw new Error('Não foi possível reduzir a imagem o suficiente, tente outra')
}

// "github.com" -> "https://github.com"
export function normalizarUrl(url: string): string {
    const limpa = url.trim()
    return /^[a-z][a-z0-9+.-]*:/i.test(limpa) ? limpa : `https://${limpa}`
}
