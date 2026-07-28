import { useState } from 'react';
import { useTransactions } from '../hooks/useTransactions';
import { useCategories } from '../hooks/useCategories';
import { Layout } from '../components/Layout';
import { TransactionForm } from '../components/TransactionForm';
import { Plus, Edit2, Trash2, Search } from 'lucide-react';
import type { Transaction, TransactionType } from '../types';

export function Transactions() {
  const [showForm, setShowForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [filterType, setFilterType] = useState<TransactionType | ''>('');
  const [searchTerm, setSearchTerm] = useState('');

  const { categories } = useCategories();
  const { transactions, loading, addTransaction, updateTransaction, deleteTransaction } = useTransactions(
    filterType ? { type: filterType } : undefined
  );

  const filteredTransactions = transactions.filter(t => {
    if (!searchTerm) return true;
    const category = categories.find(c => c.id === t.category_id);
    const searchLower = searchTerm.toLowerCase();
    return (
      category?.name.toLowerCase().includes(searchLower) ||
      t.note?.toLowerCase().includes(searchLower) ||
      t.date.includes(searchTerm)
    );
  });

  const handleSubmit = async (data: {
    amount: number;
    date: string;
    type: TransactionType;
    category_id: string;
    note: string | null;
  }) => {
    if (editingTransaction) {
      await updateTransaction(
        editingTransaction.id,
        data.amount,
        data.date,
        data.type,
        data.category_id,
        data.note
      );
    } else {
      await addTransaction(data.amount, data.date, data.type, data.category_id, data.note);
    }
  };

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('确定要删除这条交易记录吗？')) {
      await deleteTransaction(id);
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingTransaction(null);
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-2xl font-bold text-gray-800">收支管理</h1>
          <button
            onClick={() => {
              setEditingTransaction(null);
              setShowForm(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            添加交易
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder="搜索分类、备注或日期..."
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <select
              value={filterType}
              onChange={e => setFilterType(e.target.value as TransactionType | '')}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">全部类型</option>
              <option value="income">收入</option>
              <option value="expense">支出</option>
            </select>
          </div>
        </div>

        {/* Transactions list */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-gray-500">加载中...</div>
          ) : filteredTransactions.length === 0 ? (
            <div className="p-12 text-center text-gray-500">暂无交易记录</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">日期</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">类型</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">分类</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">金额</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">备注</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredTransactions.map(transaction => {
                    const category = categories.find(c => c.id === transaction.category_id);
                    return (
                      <tr key={transaction.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{transaction.date}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            transaction.type === 'income'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {transaction.type === 'income' ? '收入' : '支出'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {category?.name || '未知'}
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm font-semibold ${
                          transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {transaction.type === 'income' ? '+' : '-'}¥{Number(transaction.amount).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                          {transaction.note || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                          <button
                            onClick={() => handleEdit(transaction)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <Edit2 className="w-4 h-4 inline" />
                          </button>
                          <button
                            onClick={() => handleDelete(transaction.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="w-4 h-4 inline" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showForm && (
        <TransactionForm
          categories={categories}
          initialData={editingTransaction}
          onSubmit={handleSubmit}
          onCancel={handleCloseForm}
        />
      )}
    </Layout>
  );
}
