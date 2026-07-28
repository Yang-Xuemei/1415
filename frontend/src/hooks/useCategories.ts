import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Category, TransactionType } from '../types';
import { useToast } from './useToast';

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('type')
        .order('name');
      if (error) throw error;
      setCategories(data || []);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      showToast('error', `加载分类失败: ${msg}`);
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const addCategory = useCallback(async (name: string, type: TransactionType) => {
    try {
      const { error } = await supabase
        .from('categories')
        .insert({ name, type, is_default: false });
      if (error) throw error;
      showToast('success', '分类添加成功');
      await fetchCategories();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      showToast('error', `添加失败: ${msg}`);
    }
  }, [fetchCategories, showToast]);

  const updateCategory = useCallback(async (id: string, name: string) => {
    try {
      const { error } = await supabase
        .from('categories')
        .update({ name })
        .eq('id', id);
      if (error) throw error;
      showToast('success', '分类更新成功');
      await fetchCategories();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      showToast('error', `更新失败: ${msg}`);
    }
  }, [fetchCategories, showToast]);

  const deleteCategory = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);
      if (error) throw error;
      showToast('success', '分类删除成功');
      await fetchCategories();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      showToast('error', `删除失败: ${msg}`);
    }
  }, [fetchCategories, showToast]);

  return {
    categories,
    loading,
    addCategory,
    updateCategory,
    deleteCategory,
    refresh: fetchCategories,
  };
}
