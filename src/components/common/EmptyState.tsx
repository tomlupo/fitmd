interface EmptyStateProps {
  emoji: string;
  title: string;
  subtitle?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export default function EmptyState({ emoji, title, subtitle, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <span className="text-5xl mb-4">{emoji}</span>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">{title}</h3>
      {subtitle && (
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs">{subtitle}</p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="mt-4 px-5 py-2.5 bg-primary text-white rounded-full text-sm font-medium hover:bg-primary-dark transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
