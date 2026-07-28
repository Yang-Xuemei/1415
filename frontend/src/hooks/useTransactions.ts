import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Transaction, TransactionType } from '../types';
import { useToast } from './useToast';

export interface TransactionFilters {
  startDate?: string;
  endDate?: string;
  type?: TransactionType;
  categoryId?: string;
}

export function useTransactions(filters?: TransactionFilters) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('transactions')
        .select('*, categories(*)')
        .order('date', { ascending: false });

      if (filters?.startDate) {
        query = query.gte('date', filters.startDate);
      }
      if (filters?.endDate) {
        query = query.lte('date', filters.endDate);
      }
      if (filters?.type) {
        query = query.eq('type', filters.type);
      }
      if (filters?.categoryId) {
        query = query.eq('category_id', filters.categoryId);
      }

      const { data, error } = await query;
      if (error) throw error;
      setTransactions(data || []);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      showToast('error', `加载交易失败: ${msg}`);
    } finally {
      setLoading(false);
    }
  }, [filters, showToast]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const addTransaction = useCallback(async (
    amount: number,
    date: string,
    type: TransactionType,
    categoryId: string,
    note: string | null
  ) => {
    try {
      const { error } = await supabase
        .from('transactions')
        .insert({ amount, date, type, category_id: categoryId, note });
      if (error) throw error;
      showToast('success', '交易添加成功');
      await fetchTransactions();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      showToast('error', `添加失败: ${msg}`);
    }
  }, [fetchTransactions, showToast]);

  const updateTransaction = useCallback(async (
    id: string,
    amount: number,
    date: string,
    type: TransactionType,
    categoryId: string,
    note: string | null
  ) => {
    try {
      const { error } = await supabase
        .from('transactions')
        .update({ amount, date, type, category_id: categoryId, note })
        .eq('id', id);
      if (error) throw error;
      showToast('success', '交易更新成功');
      await fetchTransactions();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      showToast('error', `更新失败: ${msg}`);
    }
  }, [fetchTransactions, showToast]);

  const deleteTransaction = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id);
      if (error) throw error;
      showToast('success', '交易删除成功');
      await fetchTransactions();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      showToast('error', `删除失败: ${msg}`);
    }
  }, [fetchTransactions, showToast]);

  return {
    transactions,
    loading,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    refresh: fetchTransactions,
  };
}
