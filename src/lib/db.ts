import { supabase } from './supabase';
import type { User, Expense } from '../types';

export type Category = { id?: string; name: string; color: string; initials: string };

// ─── Expenses ───────────────────────────────────────────────────────────────

function rowToExpense(row: Record<string, unknown>): Expense {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    category: row.category as string,
    name: row.name as string,
    value: Number(row.value),
    note: row.note ? (row.note as string) : undefined,
    attachmentUrl: row.attachment_url ? (row.attachment_url as string) : undefined,
    createdAt: row.created_at as string,
  };
}

export async function getExpenses(): Promise<Expense[]> {
  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(rowToExpense);
}

export async function createExpense(
  data: Omit<Expense, 'id' | 'createdAt'>
): Promise<Expense> {
  const { data: row, error } = await supabase
    .from('expenses')
    .insert({
      user_id: data.userId,
      category: data.category,
      name: data.name,
      value: data.value,
      note: data.note ?? null,
      attachment_url: data.attachmentUrl ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return rowToExpense(row);
}

export async function updateExpense(
  id: string,
  data: Partial<Omit<Expense, 'id' | 'userId' | 'createdAt'>>
): Promise<void> {
  const { error } = await supabase
    .from('expenses')
    .update({
      category: data.category,
      name: data.name,
      value: data.value,
      note: data.note ?? null,
      attachment_url: data.attachmentUrl ?? null,
    })
    .eq('id', id);
  if (error) throw error;
}

export async function deleteExpense(id: string): Promise<void> {
  const { error } = await supabase.from('expenses').delete().eq('id', id);
  if (error) throw error;
}

export async function updateExpensesCategoryName(
  oldName: string,
  newName: string
): Promise<void> {
  const { error } = await supabase
    .from('expenses')
    .update({ category: newName })
    .eq('category', oldName);
  if (error) throw error;
}

// ─── Categories ─────────────────────────────────────────────────────────────

function rowToCategory(row: Record<string, unknown>): Category {
  return {
    id: row.id as string,
    name: row.name as string,
    color: row.color as string,
    initials: row.initials as string,
  };
}

export async function getCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []).map(rowToCategory);
}

export async function createCategory(
  cat: Omit<Category, 'id'>,
  userId: string
): Promise<Category> {
  const { data, error } = await supabase
    .from('categories')
    .insert({ name: cat.name, color: cat.color, initials: cat.initials, created_by: userId })
    .select()
    .single();
  if (error) throw error;
  return rowToCategory(data);
}

export async function updateCategory(
  id: string,
  updates: Partial<Omit<Category, 'id'>>
): Promise<void> {
  const { error } = await supabase.from('categories').update(updates).eq('id', id);
  if (error) throw error;
}

export async function deleteCategory(id: string): Promise<void> {
  const { error } = await supabase.from('categories').delete().eq('id', id);
  if (error) throw error;
}

// ─── User profiles ───────────────────────────────────────────────────────────

export async function getUsers(): Promise<User[]> {
  const { data, error } = await supabase.from('user_profiles').select('*');
  if (error) throw error;
  return (data ?? []).map(row => ({
    id: row.id as string,
    name: row.name as string,
    email: '',
    color: row.color as string,
    initials: row.initials as string,
  }));
}

export async function getUserProfile(userId: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (error || !data) return null;
  return {
    id: data.id as string,
    name: data.name as string,
    email: '',
    color: data.color as string,
    initials: data.initials as string,
  };
}

export async function upsertUserProfile(
  userId: string,
  profile: { name: string; color: string; initials: string }
): Promise<void> {
  const { error } = await supabase.from('user_profiles').upsert({
    id: userId,
    ...profile,
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
}

// ─── Storage ─────────────────────────────────────────────────────────────────

export async function uploadReceipt(file: File, userId: string): Promise<string> {
  const ext = file.name.split('.').pop() ?? 'jpg';
  const path = `${userId}/${Date.now()}.${ext}`;
  const { error } = await supabase.storage
    .from('receipts')
    .upload(path, file, { upsert: false });
  if (error) throw error;
  const { data } = supabase.storage.from('receipts').getPublicUrl(path);
  return data.publicUrl;
}
