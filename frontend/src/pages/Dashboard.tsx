import { useState, useMemo } from 'react';
import { useTransactions } from '../hooks/useTransactions';
import { useCategories } from '../hooks/useCategories';
import { Layout } from '../components/Layout';
import { PieChart } from '../components/PieChart';
import { TrendingUp, TrendingDown, Wallet, Calendar } from 'lucide-react';
import type { CategorySummary } from '../types';

export function Dashboard() {
  const now = new Date();
  const [viewMode, setViewMode] = useState<'month' | 'year'>('month');
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);

  const { startDate, endDate } = useMemo(() => {
    if (viewMode === 'month') {
      const start = new Date(selectedYear, selectedMonth - 1, 1);
      const end = new Date(selectedYear, selectedMonth, 0);
      return {
        startDate: start.toISOString().split('T')[0],
        endDate: end.toISOString().split('T')[0],
      };
    } else {
      const start = new Date(selectedYear, 0, 1);
      const end = new Date(selectedYear, 11, 31);
      return {
        startDate: start.toISOString().split('T')[0],
        endDate: end.toISOString().split('T')[0],
      };
    }
  }, [viewMode, selectedYear, selectedMonth]);

  const { transactions, loading } = useTransactions({ startDate, endDate });
  const { categories } = useCategories();

  const summary = useMemo(() => {
    let totalIncome = 0;
    let totalExpense = 0;
    const categoryTotals = new Map<string, number>();

    transactions.forEach(t => {
      if (t.type === 'income') {
        totalIncome += Number(t.amount);
      } else {
        totalExpense += Number(t.amount);
        const current = categoryTotals.get(t.category_id) || 0;
        categoryTotals.set(t.category_id, current + Number(t.amount));
      }
    });

    return { totalIncome, totalExpense, balance: totalIncome - totalExpense, categoryTotals };
  }, [transactions]);

  const categorySummary: CategorySummary[] = useMemo(() => {
    const total = summary.totalExpense;
    return Array.from(summary.categoryTotals.entries())
      .map(([categoryId, amount]) => {
        const category = categories.find(c => c.id === categoryId);
        return {
          category_id: categoryId,
          category_name: category?.name || '未知',
          total: amount,
          percentage: total > 0 ? (amount / total) * 100 : 0,
        };
      })
      .sort((a, b) => b.total - a.total);
  }, [summary.categoryTotals, categories]);

  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-2xl font-bold text-gray-800">仪表盘</h1>

          {/* Date selector */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('month')}
                className={`px-4 py-1.5 rounded-md text-sm transition-colors ${
                  viewMode === 'month' ? 'bg-white shadow-sm text-blue-600 font-medium' : 'text-gray-600'
                }`}
              >
                月度
              </button>
              <button
                onClick={() => setViewMode('year')}
                className={`px-4 py-1.5 rounded-md text-sm transition-colors ${
                  viewMode === 'year' ? 'bg-white shadow-sm text-blue-600 font-medium' : 'text-gray-600'
                }`}
              >
                年度
              </button>
            </div>

            <select
              value={selectedYear}
              onChange={e => setSelectedYear(Number(e.target.value))}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {years.map(y => (
                <option key={y} value={y}>{y}年</option>
              ))}
            </select>

            {viewMode === 'month' && (
              <select
                value={selectedMonth}
                onChange={e => setSelectedMonth(Number(e.target.value))}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {months.map(m => (
                  <option key={m} value={m}>{m}月</option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">总收入</p>
                <p className="text-2xl font-bold text-green-600">
                  ¥{summary.totalIncome.toFixed(2)}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">总支出</p>
                <p className="text-2xl font-bold text-red-600">
                  ¥{summary.totalExpense.toFixed(2)}
                </p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <TrendingDown className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">结余</p>
                <p className={`text-2xl font-bold ${summary.balance >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                  ¥{summary.balance.toFixed(2)}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Wallet className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Charts section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <PieChart data={categorySummary} title="支出分类占比" />

          {/* Recent transactions */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              最近交易
            </h3>
            {loading ? (
              <div className="h-64 flex items-center justify-center text-gray-500">加载中...</div>
            ) : transactions.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-gray-500">暂无交易记录</div>
            ) : (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {transactions.slice(0, 10).map(t => {
                  const category = categories.find(c => c.id === t.category_id);
                  return (
                    <div key={t.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">
                          {category?.name || '未知'}
                        </p>
                        <p className="text-xs text-gray-500">{t.date}</p>
                      </div>
                      <p className={`text-sm font-semibold ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                        {t.type === 'income' ? '+' : '-'}¥{Number(t.amount).toFixed(2)}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
