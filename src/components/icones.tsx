// Ícones em SVG inline (stroke usa currentColor para seguir a cor do texto)
const base = {
    width: 18,
    height: 18,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
}

export const IconeLixeira = () => (
    <svg {...base}>
        <path d="M3 6h18" />
        <path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" />
        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
        <path d="M10 11v6M14 11v6" />
    </svg>
)

export const IconeLapis = () => (
    <svg {...base}>
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
)

export const IconeMais = () => (
    <svg {...base}>
        <path d="M12 5v14M5 12h14" />
    </svg>
)

export const IconeMenu = () => (
    <svg {...base}>
        <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
)
