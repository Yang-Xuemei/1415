import { useState } from 'react';
import { useCategories } from '../hooks/useCategories';
import { Layout } from '../components/Layout';
import { CategoryForm } from '../components/CategoryForm';
import { Plus, Edit2, Trash2, Tag } from 'lucide-react';
import type { TransactionType } from '../types';

export function Categories() {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [activeTab, setActiveTab] = useState<TransactionType>('expense');

  const { categories, loading, addCategory, updateCategory, deleteCategory } = useCategories();

  const filteredCategories = categories.filter(c => c.type === activeTab);

  const handleSubmit = async (name: string, type: TransactionType) => {
    await addCategory(name, type);
  };

  const handleEdit = async (id: string) => {
    if (!editingName.trim()) return;
    await updateCategory(id, editingName.trim());
    setEditingId(null);
    setEditingName('');
  };

  const handleDelete = async (id: string) => {
    if (confirm('确定要删除这个分类吗？使用该分类的交易将无法删除分类。')) {
      await deleteCategory(id);
    }
  };

  const startEdit = (id: string, name: string) => {
    setEditingId(id);
    setEditingName(name);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingName('');
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-2xl font-bold text-gray-800">分类管理</h1>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            添加分类
          </button>
        </div>

        {/* Tabs */}
        <div className="flex bg-gray-100 rounded-lg p-1 w-fit">
          <button
            onClick={() => setActiveTab('expense')}
            className={`px-6 py-2 rounded-md text-sm transition-colors ${
              activeTab === 'expense'
                ? 'bg-white shadow-sm text-red-600 font-medium'
                : 'text-gray-600'
            }`}
          >
            支出分类
          </button>
          <button
            onClick={() => setActiveTab('income')}
            className={`px-6 py-2 rounded-md text-sm transition-colors ${
              activeTab === 'income'
                ? 'bg-white shadow-sm text-green-600 font-medium'
                : 'text-gray-600'
            }`}
          >
            收入分类
          </button>
        </div>

        {/* Categories list */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-gray-500">加载中...</div>
          ) : filteredCategories.length === 0 ? (
            <div className="p-12 text-center text-gray-500">暂无分类</div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredCategories.map(category => (
                <div key={category.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
                  {editingId === category.id ? (
                    <div className="flex-1 flex items-center gap-3">
                      <input
                        type="text"
                        value={editingName}
                        onChange={e => setEditingName(e.target.value)}
                        className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        maxLength={20}
                        autoFocus
                      />
                      <button
                        onClick={() => handleEdit(category.id)}
                        className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                      >
                        保存
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="px-3 py-1.5 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-100"
                      >
                        取消
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          category.type === 'expense' ? 'bg-red-100' : 'bg-green-100'
                        }`}>
                          <Tag className={`w-5 h-5 ${
                            category.type === 'expense' ? 'text-red-600' : 'text-green-600'
                          }`} />
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">{category.name}</p>
                          {category.is_default && (
                            <p className="text-xs text-gray-500">系统预设</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => startEdit(category.id, category.name)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(category.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showForm && (
        <CategoryForm
          onSubmit={handleSubmit}
          onCancel={() => setShowForm(false)}
        />
      )}
    </Layout>
  );
}
