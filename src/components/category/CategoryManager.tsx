import { useState } from 'react';
import { Category, CATEGORY_COLORS, DEFAULT_EXPENSE_CATEGORIES, DEFAULT_INCOME_CATEGORIES } from '../../types';
import Modal from '../common/Modal';
import ConfirmDialog from '../common/ConfirmDialog';
import Toast from '../common/Toast';

interface CategoryManagerProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  onAdd: (cat: Omit<Category, 'id' | 'order'>) => void;
  onUpdate: (id: string, updates: Partial<Category>) => void;
  onDelete: (id: string) => void;
}

export default function CategoryManager({ isOpen, onClose, categories, onAdd, onUpdate, onDelete }: CategoryManagerProps) {
  const [activeType, setActiveType] = useState<'expense' | 'income'>('expense');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editCategory, setEditCategory] = useState<Category | null>(null);
  const [deleteCategory, setDeleteCategory] = useState<Category | null>(null);
  const [toast, setToast] = useState({ show: false, message: '', type: 'error' as 'success' | 'error' | 'info' });

  const filtered = categories
    .filter((c) => c.type === activeType)
    .sort((a, b) => a.order - b.order);

  const suggestions = activeType === 'expense'
    ? DEFAULT_EXPENSE_CATEGORIES.filter(s => !filtered.some(c => c.name === s.name))
    : DEFAULT_INCOME_CATEGORIES.filter(s => !filtered.some(c => c.name === s.name));

  const handleAddSuggestion = (suggestion: typeof DEFAULT_EXPENSE_CATEGORIES[0]) => {
    if (activeType === 'expense' && filtered.length >= 24) {
      setToast({ show: true, message: 'Maximum 24 expense categories', type: 'error' });
      return;
    }
    onAdd(suggestion);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Categories" fullScreen>
      <div className="p-5">
        {/* Type Toggle */}
        <div className="flex bg-gray-100 dark:bg-gray-700 rounded-xl p-1 mb-5">
          {(['expense', 'income'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setActiveType(type)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                activeType === type
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              {type === 'expense' ? 'Expenses' : 'Income'}
            </button>
          ))}
        </div>

        {/* Category List */}
        <div className="space-y-2 mb-6">
          {filtered.map((cat) => (
            <div
              key={cat.id}
              className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-xl px-4 py-3 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <span
                  className="w-10 h-10 rounded-full flex items-center justify-center text-lg"
                  style={{ backgroundColor: cat.color + '20' }}
                >
                  {cat.emoji}
                </span>
                <span className="font-medium text-gray-900 dark:text-white">{cat.name}</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setEditCategory(cat)}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </button>
                <button
                  onClick={() => setDeleteCategory(cat)}
                  className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                </button>
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="text-center py-8 text-gray-400 dark:text-gray-500">
              <p className="text-sm">No {activeType} categories yet</p>
            </div>
          )}
        </div>

        {/* Add Button */}
        <button
          onClick={() => setShowAddForm(true)}
          className={`w-full py-3 rounded-xl text-sm font-medium transition-colors mb-6 ${
            activeType === 'expense' && filtered.length >= 24
              ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
              : 'bg-primary/10 text-primary hover:bg-primary/20'
          }`}
          disabled={activeType === 'expense' && filtered.length >= 24}
        >
          + New {activeType === 'expense' ? 'Expense' : 'Income'} Category
        </button>

        {/* Suggestions */}
        {suggestions.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">Suggestions</h4>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((s) => (
                <button
                  key={s.name}
                  onClick={() => handleAddSuggestion(s)}
                  className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-full px-3 py-2 shadow-sm hover:shadow-md transition-shadow"
                >
                  <span>{s.emoji}</span>
                  <span className="text-sm text-gray-700 dark:text-gray-300">{s.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Form */}
      {(showAddForm || editCategory) && (
        <CategoryForm
          category={editCategory}
          type={activeType}
          existingNames={filtered.map(c => c.name).filter(n => n !== editCategory?.name)}
          onSave={(data) => {
            if (editCategory) {
              onUpdate(editCategory.id, data);
            } else {
              onAdd({
                name: data.name || '',
                emoji: data.emoji || '',
                color: data.color || '#6366F1',
                type: activeType,
              });
            }
            setShowAddForm(false);
            setEditCategory(null);
          }}
          onClose={() => { setShowAddForm(false); setEditCategory(null); }}
        />
      )}

      <ConfirmDialog
        isOpen={!!deleteCategory}
        title="Delete Category"
        message={`Are you sure you want to delete "${deleteCategory?.name}"? All transactions in this category will also be deleted. This cannot be undone.`}
        onConfirm={() => { if (deleteCategory) onDelete(deleteCategory.id); setDeleteCategory(null); }}
        onCancel={() => setDeleteCategory(null)}
      />

      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.show}
        onClose={() => setToast(prev => ({ ...prev, show: false }))}
      />
    </Modal>
  );
}

interface CategoryFormProps {
  category: Category | null;
  type: 'expense' | 'income';
  existingNames: string[];
  onSave: (data: Partial<Category>) => void;
  onClose: () => void;
}

function CategoryForm({ category, type, existingNames, onSave, onClose }: CategoryFormProps) {
  const [emoji, setEmoji] = useState(category?.emoji || '');
  const [name, setName] = useState(category?.name || '');
  const [color, setColor] = useState(category?.color || CATEGORY_COLORS[0]);
  const [error, setError] = useState('');

  const handleSubmit = () => {
    if (!emoji) { setError('Please enter an emoji'); return; }
    if (!name.trim()) { setError('Please enter a name'); return; }
    if (existingNames.includes(name.trim())) { setError('Category name already exists'); return; }
    onSave({ emoji, name: name.trim(), color: type === 'income' ? '#10B981' : color });
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl w-full max-w-sm overflow-hidden animate-scaleIn shadow-xl" onClick={e => e.stopPropagation()}>
        <div className="p-5">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {category ? 'Edit Category' : 'New Category'}
          </h3>

          {/* Emoji Input */}
          <div className="mb-4">
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block">Emoji</label>
            <input
              type="text"
              value={emoji}
              onChange={(e) => setEmoji(e.target.value.slice(-2))}
              placeholder="🍔"
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 rounded-xl text-center text-2xl border-0 outline-none focus:ring-2 focus:ring-primary/30"
              maxLength={2}
            />
          </div>

          {/* Name Input */}
          <div className="mb-4">
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); setError(''); }}
              placeholder="Category name"
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 rounded-xl text-gray-900 dark:text-white border-0 outline-none focus:ring-2 focus:ring-primary/30"
              maxLength={20}
            />
          </div>

          {/* Color Picker (expenses only) */}
          {type === 'expense' && (
            <div className="mb-4">
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block">Color</label>
              <div className="flex flex-wrap gap-2">
                {CATEGORY_COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    className={`w-8 h-8 rounded-full transition-all ${
                      color === c ? 'ring-2 ring-offset-2 ring-gray-400 dark:ring-offset-gray-800 scale-110' : ''
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Preview */}
          <div className="mb-4 flex items-center gap-3 bg-gray-50 dark:bg-gray-700 rounded-xl px-4 py-3">
            <span
              className="w-10 h-10 rounded-full flex items-center justify-center text-lg"
              style={{ backgroundColor: (type === 'income' ? '#10B981' : color) + '20' }}
            >
              {emoji || '?'}
            </span>
            <span className="font-medium text-gray-900 dark:text-white">{name || 'Preview'}</span>
          </div>

          {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium text-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="flex-1 py-3 rounded-xl bg-primary text-white font-medium text-sm hover:bg-primary-dark transition-colors"
            >
              {category ? 'Save' : 'Create'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
