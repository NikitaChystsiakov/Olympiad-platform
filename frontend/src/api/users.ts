import { http } from './http';
import type { AdminUserPayload, PageResponse, User, UserRole } from '@/types';

export async function getUsers(params: {
  page: number;
  size: number;
  search?: string;
  role?: UserRole | '';
}) {
  const { data } = await http.get<PageResponse<User>>('/admin/users', { params });
  return data;
}

export async function createUser(payload: AdminUserPayload) {
  const { data } = await http.post<User>('/admin/users', payload);
  return data;
}

export async function updateUser(id: string, payload: AdminUserPayload) {
  const { data } = await http.put<User>(`/admin/users/${id}`, payload);
  return data;
}

export async function deleteUser(id: string) {
  await http.delete(`/admin/users/${id}`);
}
