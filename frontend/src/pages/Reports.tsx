import { useState, useMemo, useRef } from 'react';
import { useTransactions } from '../hooks/useTransactions';
import { useCategories } from '../hooks/useCategories';
import { Layout } from '../components/Layout';
import { PieChart } from '../components/PieChart';
import { exportToCSV, exportToPDF } from '../utils/export';
import { Download, FileText, Table } from 'lucide-react';
import type { CategorySummary } from '../types';
import { useToast } from '../hooks/useToast';

export function Reports() {
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const reportRef = useRef<HTMLDivElement>(null);
  const { showToast } = useToast();

  const { startDate, endDate } = useMemo(() => {
    const start = new Date(selectedYear, selectedMonth - 1, 1);
    const end = new Date(selectedYear, selectedMonth, 0);
    return {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
    };
  }, [selectedYear, selectedMonth]);

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

  const handleExportCSV = () => {
    if (transactions.length === 0) {
      showToast('info', '没有可导出的数据');
      return;
    }
    exportToCSV(transactions, categories, `transactions_${startDate}_to_${endDate}.csv`);
    showToast('success', 'CSV 导出成功');
  };

  const handleExportPDF = async () => {
    if (!reportRef.current) return;
    if (transactions.length === 0) {
      showToast('info', '没有可导出的数据');
      return;
    }
    try {
      await exportToPDF(reportRef.current, `report_${startDate}_to_${endDate}.pdf`);
      showToast('success', 'PDF 导出成功');
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      showToast('error', `PDF 导出失败: ${msg}`);
    }
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-2xl font-bold text-gray-800">报表导出</h1>

          {/* Date selector */}
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={selectedYear}
              onChange={e => setSelectedYear(Number(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {years.map(y => (
                <option key={y} value={y}>{y}年</option>
              ))}
            </select>

            <select
              value={selectedMonth}
              onChange={e => setSelectedMonth(Number(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {months.map(m => (
                <option key={m} value={m}>{m}月</option>
              ))}
            </select>
          </div>
        </div>

        {/* Export buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleExportCSV}
            disabled={loading || transactions.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            <Table className="w-5 h-5" />
            导出 CSV
          </button>
          <button
            onClick={handleExportPDF}
            disabled={loading || transactions.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            <FileText className="w-5 h-5" />
            导出 PDF
          </button>
        </div>

        {/* Report content */}
        <div ref={reportRef} className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
          {loading ? (
            <div className="p-12 text-center text-gray-500">加载中...</div>
          ) : transactions.length === 0 ? (
            <div className="p-12 text-center text-gray-500">该时间段暂无交易记录</div>
          ) : (
            <>
              {/* Report header */}
              <div className="text-center border-b pb-4">
                <h2 className="text-2xl font-bold text-gray-800">
                  {selectedYear}年{selectedMonth}月 财务报告
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  {startDate} 至 {endDate}
                </p>
              </div>

              {/* Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <p className="text-sm text-green-700 mb-1">总收入</p>
                  <p className="text-2xl font-bold text-green-600">¥{summary.totalIncome.toFixed(2)}</p>
                </div>
                <div className="bg-red-50 rounded-lg p-4 text-center">
                  <p className="text-sm text-red-700 mb-1">总支出</p>
                  <p className="text-2xl font-bold text-red-600">¥{summary.totalExpense.toFixed(2)}</p>
                </div>
                <div className="bg-blue-50 rounded-lg p-4 text-center">
                  <p className="text-sm text-blue-700 mb-1">结余</p>
                  <p className={`text-2xl font-bold ${summary.balance >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                    ¥{summary.balance.toFixed(2)}
                  </p>
                </div>
              </div>

              {/* Pie chart */}
              {categorySummary.length > 0 && (
                <PieChart data={categorySummary} title="支出分类占比" />
              )}

              {/* Transaction details */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <Download className="w-5 h-5" />
                  交易明细
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-4 py-2 text-left font-medium text-gray-600">日期</th>
                        <th className="px-4 py-2 text-left font-medium text-gray-600">类型</th>
                        <th className="px-4 py-2 text-left font-medium text-gray-600">分类</th>
                        <th className="px-4 py-2 text-left font-medium text-gray-600">金额</th>
                        <th className="px-4 py-2 text-left font-medium text-gray-600">备注</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {transactions.map(t => {
                        const category = categories.find(c => c.id === t.category_id);
                        return (
                          <tr key={t.id}>
                            <td className="px-4 py-2">{t.date}</td>
                            <td className="px-4 py-2">
                              <span className={t.type === 'income' ? 'text-green-600' : 'text-red-600'}>
                                {t.type === 'income' ? '收入' : '支出'}
                              </span>
                            </td>
                            <td className="px-4 py-2">{category?.name || '未知'}</td>
                            <td className={`px-4 py-2 font-semibold ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                              {t.type === 'income' ? '+' : '-'}¥{Number(t.amount).toFixed(2)}
                            </td>
                            <td className="px-4 py-2 text-gray-600">{t.note || '-'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}
