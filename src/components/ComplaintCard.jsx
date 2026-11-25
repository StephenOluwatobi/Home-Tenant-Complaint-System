import { Link } from 'react-router-dom'
import StatusBadge from './StatusBadge.jsx'
import { formatDate } from '../lib/validation.js'

export default function ComplaintCard({ complaint, to, showUnit }) {
  const body = (
    <div className="flex items-start justify-between gap-4 p-4">
      <div className="min-w-0">
        <p className="font-semibold">
          {showUnit && <span className="mr-2 text-door">Unit {complaint.unit}</span>}
          {complaint.category}
        </p>
        <p className="mt-1 line-clamp-2 text-sm text-slate-600">{complaint.description}</p>
        <p className="mt-2 text-xs text-slate-500">Submitted {formatDate(complaint.createdAt)}</p>
      </div>
      <StatusBadge status={complaint.status} />
    </div>
  )
  return to ? (
    <Link to={to} className="panel block hover:border-door">{body}</Link>
  ) : (
    <div className="panel">{body}</div>
  )
}
