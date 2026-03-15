// Skeleton de tabla reutilizable para estados de carga en listas
const shimmerStyle = {
  background: 'linear-gradient(90deg, var(--bg-sunken) 25%, var(--border) 50%, var(--bg-sunken) 75%)',
  backgroundSize: '200% 100%',
  animation: 'shimmer 1.5s infinite',
  borderRadius: 6,
}

function SkeletonCell({ width = '70%', height = 13 }) {
  return <div style={{ ...shimmerStyle, width, height }} />
}

// cols: array de { width } (mismos valores que gridTemplateColumns)
// rows: cantidad de filas a mostrar
export default function SkeletonTable({ cols, rows = 6 }) {
  const gridTemplateColumns = cols.map(c => c.width).join(' ')

  return (
    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          style={{
            display: 'grid',
            gridTemplateColumns,
            padding: '16px 20px',
            alignItems: 'center',
            gap: '0 16px',
            borderBottom: i < rows - 1 ? '1px solid var(--border)' : 'none',
          }}
        >
          {cols.map((col, j) => (
            <SkeletonCell key={j} width={col.skeletonWidth || '70%'} height={col.skeletonHeight || 13} />
          ))}
        </div>
      ))}
    </div>
  )
}
