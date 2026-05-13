import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { createUser, deleteUser, getUsers, updateUser } from '@/api/users';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { Loader } from '@/components/ui/Loader';
import { Select } from '@/components/ui/Select';
import type { AdminUserPayload, User, UserRole } from '@/types';

const emptyForm: AdminUserPayload = {
  email: '',
  password: '',
  fullName: '',
  role: 'STUDENT',
  active: true,
};

export function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState<UserRole | ''>('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<AdminUserPayload>(emptyForm);

  const isEditing = useMemo(() => Boolean(editingId), [editingId]);

  useEffect(() => {
    void loadUsers();
  }, [page, role]);

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      const data = await getUsers({ page, size: 10, search: search.trim(), role });
      setUsers(data.content);
      setTotalPages(data.totalPages || 1);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Не удалось загрузить пользователей');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  const startEdit = (user: User) => {
    setEditingId(user.id);
    setForm({
      email: user.email,
      password: '',
      fullName: user.fullName,
      role: user.role,
      active: user.active ?? true,
    });
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    try {
      setIsSaving(true);
      const payload = { ...form };
      if (isEditing && !payload.password) {
        delete payload.password;
      }
      if (editingId) {
        await updateUser(editingId, payload);
        toast.success('Пользователь обновлен');
      } else {
        await createUser(payload);
        toast.success('Пользователь создан');
      }
      resetForm();
      await loadUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Не удалось сохранить пользователя');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (user: User) => {
    if (!window.confirm(`Удалить пользователя ${user.email}?`)) return;
    try {
      await deleteUser(user.id);
      toast.success('Пользователь удален');
      await loadUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Не удалось удалить пользователя');
    }
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
      <Card className="h-fit rounded-[18px]">
        <h1 className="text-2xl font-extrabold">Пользователи</h1>
        <p className="mt-2 text-sm text-[rgb(var(--text-soft))]">
          Управление аккаунтами и ролями доступно только администраторам.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <Input
            value={form.email ?? ''}
            onChange={(event) => setForm({ ...form, email: event.target.value })}
            placeholder="Email"
            type="email"
            required={!isEditing}
          />
          <Input
            value={form.fullName ?? ''}
            onChange={(event) => setForm({ ...form, fullName: event.target.value })}
            placeholder="ФИО"
            required={!isEditing}
          />
          <Input
            value={form.password ?? ''}
            onChange={(event) => setForm({ ...form, password: event.target.value })}
            placeholder={isEditing ? 'Новый пароль, если нужно' : 'Пароль'}
            type="password"
            minLength={6}
            required={!isEditing}
          />
          <Select
            value={form.role ?? 'STUDENT'}
            onChange={(event) => setForm({ ...form, role: event.target.value as UserRole })}
          >
            <option value="STUDENT">STUDENT</option>
            <option value="ORGANIZER">ORGANIZER</option>
            <option value="ADMIN">ADMIN</option>
          </Select>
          <label className="flex items-center gap-3 rounded-xl border border-[rgb(var(--border))] px-4 py-3 text-sm font-semibold">
            <input
              type="checkbox"
              checked={form.active ?? true}
              onChange={(event) => setForm({ ...form, active: event.target.checked })}
            />
            Активен
          </label>
          <div className="flex gap-2">
            <Button type="submit" disabled={isSaving} className="flex-1">
              {isEditing ? 'Сохранить' : 'Добавить'}
            </Button>
            {isEditing && (
              <Button type="button" variant="secondary" onClick={resetForm}>
                Отмена
              </Button>
            )}
          </div>
        </form>
      </Card>

      <Card className="rounded-[18px]">
        <div className="grid gap-3 md:grid-cols-[1fr_180px_auto]">
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Поиск по email или ФИО"
          />
          <Select value={role} onChange={(event) => setRole(event.target.value as UserRole | '')}>
            <option value="">Все роли</option>
            <option value="STUDENT">STUDENT</option>
            <option value="ORGANIZER">ORGANIZER</option>
            <option value="ADMIN">ADMIN</option>
          </Select>
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              setPage(0);
              void loadUsers();
            }}
          >
            Найти
          </Button>
        </div>

        <div className="mt-6 overflow-x-auto">
          {isLoading ? (
            <Loader />
          ) : users.length === 0 ? (
            <EmptyState title="Пользователи не найдены" description="Измените фильтры или добавьте нового пользователя." />
          ) : (
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="border-b border-[rgb(var(--border))] text-xs uppercase tracking-[0.12em] text-[rgb(var(--text-soft))]">
                <tr>
                  <th className="py-3">Пользователь</th>
                  <th className="py-3">Роль</th>
                  <th className="py-3">Статус</th>
                  <th className="py-3 text-right">Действия</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-[rgba(var(--border),0.45)]">
                    <td className="py-4">
                      <p className="font-semibold">{user.fullName}</p>
                      <p className="text-[rgb(var(--text-soft))]">{user.email}</p>
                    </td>
                    <td className="py-4">
                      <Badge tone={user.role === 'ADMIN' ? 'danger' : user.role === 'ORGANIZER' ? 'warning' : 'success'}>
                        {user.role}
                      </Badge>
                    </td>
                    <td className="py-4">{user.active === false ? 'Отключен' : 'Активен'}</td>
                    <td className="py-4">
                      <div className="flex justify-end gap-2">
                        <Button type="button" variant="secondary" onClick={() => startEdit(user)}>
                          Изменить
                        </Button>
                        <Button type="button" variant="danger" onClick={() => void handleDelete(user)}>
                          Удалить
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="mt-4 flex items-center justify-between">
          <Button type="button" variant="secondary" disabled={page === 0} onClick={() => setPage((value) => value - 1)}>
            Назад
          </Button>
          <span className="text-sm text-[rgb(var(--text-soft))]">
            {page + 1} / {totalPages}
          </span>
          <Button
            type="button"
            variant="secondary"
            disabled={page + 1 >= totalPages}
            onClick={() => setPage((value) => value + 1)}
          >
            Вперед
          </Button>
        </div>
      </Card>
    </div>
  );
}
