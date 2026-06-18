interface AvatarProps {
  name: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

/**
 * Generate a deterministic color from a string using HSL
 */
function getColorFromString(str: string): { hue: number; saturation: number; lightness: number } {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }
  
  const hue = Math.abs(hash % 360)
  const saturation = 60 + Math.abs((hash >> 8) % 30) // 60-90%
  const lightness = 45 + Math.abs((hash >> 16) % 15) // 45-60%
  
  return { hue, saturation, lightness }
}

/**
 * Get initials from a name (1-2 characters)
 */
function getInitials(name: string): string {
  const trimmed = name.trim()
  if (!trimmed) return '?'
  
  const parts = trimmed.split(/\s+/) // Split by whitespace
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase()
  }
  
  // Take first letter of first and last word
  const first = parts[0].charAt(0).toUpperCase()
  const last = parts[parts.length - 1].charAt(0).toUpperCase()
  return first + last
}

const SIZE_MAP = {
  sm: { width: '32px', height: '32px', fontSize: '0.75rem' },
  md: { width: '48px', height: '48px', fontSize: '1rem' },
  lg: { width: '64px', height: '64px', fontSize: '1.25rem' },
  xl: { width: '96px', height: '96px', fontSize: '1.75rem' },
}

const Avatar: React.FC<AvatarProps> = ({ name, size = 'md', className = '' }) => {
  const { hue, saturation, lightness } = getColorFromString(name)
  const initials = getInitials(name)
  const dimensions = SIZE_MAP[size]
  
  const bgColor = `hsl(${hue}, ${saturation}%, ${lightness}%)`
  const shadowColor = `hsl(${hue}, ${saturation}%, ${lightness - 20}%)`
  
  return (
    <div
      className={`avatar ${className}`}
      style={{
        width: dimensions.width,
        height: dimensions.height,
        borderRadius: '50%',
        background: `linear-gradient(135deg, ${bgColor} 0%, ${shadowColor} 100%)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: dimensions.fontSize,
        fontWeight: 700,
        color: 'white',
        textShadow: '0 1px 2px rgba(0,0,0,0.3)',
        border: '2px solid rgba(255,255,255,0.15)',
        boxShadow: `0 2px 8px ${shadowColor}40`,
        flexShrink: 0,
      }}
      title={name}
    >
      {initials}
    </div>
  )
}

export default Avatar
