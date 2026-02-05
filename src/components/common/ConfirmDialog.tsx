interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  isOpen, title, message, confirmLabel = 'Delete', cancelLabel = 'Cancel',
  destructive = true, onConfirm, onCancel,
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" onClick={onCancel}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative bg-white dark:bg-gray-800 rounded-2xl w-full max-w-sm overflow-hidden animate-scaleIn shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 text-center">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{title}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">{message}</p>
        </div>
        <div className="border-t border-gray-100 dark:border-gray-700 flex">
          <button
            onClick={onCancel}
            className="flex-1 py-3.5 text-sm font-medium text-primary border-r border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 py-3.5 text-sm font-semibold transition-colors ${
              destructive
                ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'
                : 'text-primary hover:bg-indigo-50 dark:hover:bg-indigo-900/20'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
