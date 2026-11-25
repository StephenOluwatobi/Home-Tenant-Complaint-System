const STYLES = {
  Pending: 'bg-pending-soft text-pending',
  'In-Progress': 'bg-progress-soft text-progress',
  Resolved: 'bg-resolved-soft text-resolved',
}

export default function StatusBadge({ status }) {
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${STYLES[status]}`}>
      {status}
    </span>
  )
}
