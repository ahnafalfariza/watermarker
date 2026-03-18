export default function Toast({ toasts, onDismiss }) {
  if (toasts.length === 0) return null

  const handleAction = async (toast) => {
    try {
      await toast.onAction?.()
    } finally {
      onDismiss(toast.id)
    }
  }

  return (
    <div className="toast-container" role="status" aria-live="polite">
      {toasts.map(toast => (
        <div key={toast.id} className={`toast toast-${toast.type}`}>
          <span className="toast-message">{toast.message}</span>
          {toast.actionLabel && (
            <button
              className="toast-action"
              onClick={() => handleAction(toast)}
            >
              {toast.actionLabel}
            </button>
          )}
          <button
            className="toast-dismiss"
            onClick={() => onDismiss(toast.id)}
            aria-label="Dismiss"
          >
            &times;
          </button>
        </div>
      ))}
    </div>
  )
}
