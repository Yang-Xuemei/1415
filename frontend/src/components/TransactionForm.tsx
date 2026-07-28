import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { Transaction, TransactionType, Category } from '../types';

interface TransactionFormProps {
  categories: Category[];
  initialData?: Transaction | null;
  onSubmit: (data: {
    amount: number;
    date: string;
    type: TransactionType;
    category_id: string;
    note: string | null;
  }) => Promise<void>;
  onCancel: () => void;
}

export function TransactionForm({ categories, initialData, onSubmit, onCancel }: TransactionFormProps) {
  const [type, setType] = useState<TransactionType>(initialData?.type || 'expense');
  const [amount, setAmount] = useState(initialData?.amount?.toString() || '');
  const [date, setDate] = useState(initialData?.date || new Date().toISOString().split('T')[0]);
  const [categoryId, setCategoryId] = useState(initialData?.category_id || '');
  const [note, setNote] = useState(initialData?.note || '');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const filteredCategories = categories.filter(c => c.type === type);

  useEffect(() => {
    if (!categoryId || !filteredCategories.find(c => c.id === categoryId)) {
      setCategoryId(filteredCategories[0]?.id || '');
    }
  }, [type, filteredCategories, categoryId]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      newErrors.amount = '请输入有效的正数金额';
    }
    if (!date) {
      newErrors.date = '请选择日期';
    }
    if (!categoryId) {
      newErrors.category = '请选择分类';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      await onSubmit({
        amount: Number(amount),
        date,
        type,
        category_id: categoryId,
        note: note.trim() || null,
      });
      onCancel();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-800">
            {initialData ? '编辑交易' : '添加交易'}
          </h2>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">类型</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setType('expense')}
                className={`flex-1 py-2 rounded-lg border transition-colors ${
                  type === 'expense'
                    ? 'bg-red-50 border-red-300 text-red-700'
                    : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                }`}
              >
                支出
              </button>
              <button
                type="button"
                onClick={() => setType('income')}
                className={`flex-1 py-2 rounded-lg border transition-colors ${
                  type === 'income'
                    ? 'bg-green-50 border-green-300 text-green-700'
                    : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                }`}
              >
                收入
              </button>
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">金额</label>
            <input
              type="number"
              step="0.01"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                errors.amount ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
              }`}
              placeholder="0.00"
            />
            {errors.amount && <p className="text-red-500 text-sm mt-1">{errors.amount}</p>}
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">日期</label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                errors.date ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
              }`}
            />
            {errors.date && <p className="text-red-500 text-sm mt-1">{errors.date}</p>}
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">分类</label>
            <select
              value={categoryId}
              onChange={e => setCategoryId(e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                errors.category ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
              }`}
            >
              <option value="">选择分类</option>
              {filteredCategories.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
            {errors.category && <p className="text-red-500 text-sm mt-1">{errors.category}</p>}
          </div>

          {/* Note */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">备注 (可选)</label>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="添加备注..."
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {submitting ? '保存中...' : '保存'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
