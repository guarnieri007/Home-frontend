const style_background_inside: React.CSSProperties = {
    boxSizing: 'border-box',
    position: 'relative',
    width: '100%',
    height: '100%',
    padding: '12px',
    zIndex: -1,
    borderRadius: '8px',
    border: '4px solid rgba(182, 179, 179, 0.1)',
    background: '#464646',
    backdropFilter: 'blur(2px)',
    overflow: 'hidden',
}

interface BackgroundProps {
    // Define any props you want to pass to the Background component here
    inside?: React.ReactNode,
    styles?: React.CSSProperties,
}

const Background: React.FC<BackgroundProps> = ({ inside, styles = {} }) => {
    return (
        <div>
            <div className="background" style={{ ...style_background_inside, ... styles }}>
                {inside}
            </div>
        </div>
    )
}

export default Background