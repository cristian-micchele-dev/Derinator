import './PageSkeleton.css'

export default function PageSkeleton() {
  return (
    <div className="skeleton-page">
      <div className="skeleton-header">
        <div className="skeleton-line skeleton-title" />
        <div className="skeleton-line skeleton-subtitle" />
      </div>
      <div className="skeleton-body">
        <div className="skeleton-avatar" />
        <div className="skeleton-line skeleton-text" />
        <div className="skeleton-line skeleton-text short" />
        <div className="skeleton-btn" />
      </div>
    </div>
  )
}
