import { Pencil, Plus, Search, Trash2, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { errorMessage } from '@/api/http';
import { createUser, deleteUser, getUsers, updateUser } from '@/api/users';
import { useT } from '@/i18n';
import { useAuthStore } from '@/store/authStore';
import type { AdminUserPayload, PageResponse, User, UserRole } from '@/types';
import { cn } from '@/utils/cn';
import { formatDate } from '@/utils/format';
import { Badge, type BadgeTone } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Chips } from '@/components/ui/Chips';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { Field, Input, Select } from '@/components/ui/Field';
import { PageHeader } from '@/components/ui/PageHeader';
import { Skeleton } from '@/components/ui/Skeleton';

const ROLES: UserRole[] = ['STUDENT', 'ORGANIZER', 'ADMIN'];
const roleTone: Record<UserRole, BadgeTone> = { STUDENT: 'neutral', ORGANIZER: 'accent', ADMIN: 'ink' };
const PAGE_SIZE = 20;

type EditorState = { mode: 'create' } | { mode: 'edit'; user: User } | null;

export function AdminUsersPage() {
  const t = useT();
  const me = useAuthStore((state) => state.user);
  const [role, setRole] = useState<UserRole | ''>('');
  const [searchDraft, setSearchDraft] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [data, setData] = useState<PageResponse<User> | null>(null);
  const [loading, setLoading] = useState(true);
  const [editor, setEditor] = useState<EditorState>(null);
  const [toDelete, setToDelete] = useState<User | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchDraft.trim());
      setPage(0);
    }, 350);
    return () => window.clearTimeout(timer);
  }, [searchDraft]);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setData(await getUsers({ page, size: PAGE_SIZE, role, search: search || undefined }));
    } catch (error) {
      toast.error(errorMessage(error, 'errors.load'));
    } finally {
      setLoading(false);
    }
  }, [page, role, search]);

  useEffect(() => {
    void load();
  }, [load]);

  const remove = async () => {
    if (!toDelete) return;
    try {
      await deleteUser(toDelete.id);
      toast.success(t('users.deleted'));
      setToDelete(null);
      await load();
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  const users = data?.content ?? [];

  return (
    <>
      <PageHeader
        title={t('users.title')}
        lead={t('users.lead')}
        actions={
          <Button onClick={() => setEditor({ mode: 'create' })}>
            <Plus className="h-4 w-4" />
            {t('users.create')}
          </Button>
        }
      />

      {editor && (
        <UserEditor
          key={editor.mode === 'edit' ? editor.user.id : 'new'}
          state={editor}
          isSelf={editor.mode === 'edit' && editor.user.email === me?.email}
          onClose={() => setEditor(null)}
          onSaved={async () => {
            setEditor(null);
            await load();
          }}
        />
      )}

      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <Chips<UserRole | ''>
          label={t('common.role')}
          value={role}
          onChange={(value) => {
            setRole(value);
            setPage(0);
          }}
          options={[{ value: '', label: t('common.all') }, ...ROLES.map((item) => ({ value: item, label: t(`roles.${item}`) }))]}
        />
        <label className="relative block md:w-72">
          <span className="sr-only">{t('common.search')}</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-soft" />
          <Input type="search" value={searchDraft} onChange={(event) => setSearchDraft(event.target.value)} placeholder={t('users.searchPlaceholder')} className="bg-surface pl-9" />
        </label>
      </div>

      {loading && !data ? (
        <Skeleton className="h-80 w-full rounded-card" />
      ) : users.length === 0 ? (
        <EmptyState title={t('users.empty')} />
      ) : (
        <div className={cn('overflow-hidden rounded-card border border-line bg-surface shadow-lift transition-opacity', loading && 'opacity-60')}>
          <div className="relative overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-muted">
                <tr className="text-[11px] font-semibold uppercase tracking-[0.08em] text-soft">
                  <th className="px-5 py-3">{t('common.fullName')}</th>
                  <th className="px-3 py-3">{t('common.role')}</th>
                  <th className="px-3 py-3">{t('common.status')}</th>
                  <th className="px-3 py-3">{t('users.created')}</th>
                  <th className="px-5 py-3 text-right">
                    <span className="sr-only">{t('common.actions')}</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => {
                  const isSelf = user.email === me?.email;
                  return (
                    <tr key={user.id} className="border-t border-line/70">
                      <td className="px-5 py-3">
                        <p className="font-semibold">
                          {user.fullName}
                          {isSelf && <span className="ml-2 text-xs font-medium text-soft">({t('users.you')})</span>}
                        </p>
                        <p className="text-xs text-soft">{user.email}</p>
                      </td>
                      <td className="px-3 py-3">
                        <Badge tone={roleTone[user.role]}>{t(`roles.${user.role}`)}</Badge>
                      </td>
                      <td className="px-3 py-3">
                        <span className={cn('inline-flex items-center gap-2 font-medium', user.active ? 'text-risk-low' : 'text-risk-high')}>
                          <span className="h-2 w-2 rounded-full bg-current" />
                          {user.active ? t('users.active') : t('users.blocked')}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-soft">{formatDate(user.createdAt)}</td>
                      <td className="px-5 py-3">
                        <div className="flex justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => setEditor({ mode: 'edit', user })}
                            aria-label={t('common.edit')}
                            className="grid h-9 w-9 place-items-center rounded-control text-soft hover:bg-fg/[0.06] hover:text-fg"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            disabled={isSelf}
                            onClick={() => setToDelete(user)}
                            aria-label={t('common.delete')}
                            className="grid h-9 w-9 place-items-center rounded-control text-soft hover:bg-risk-high-bg hover:text-risk-high disabled:pointer-events-none disabled:opacity-30"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {data && data.totalPages > 1 && (
        <nav className="mt-6 flex items-center justify-between" aria-label="pagination">
          <span className="text-sm text-soft">{t('common.page', { page: page + 1, total: data.totalPages })}</span>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" disabled={page === 0} onClick={() => setPage(page - 1)}>
              {t('common.prev')}
            </Button>
            <Button variant="secondary" size="sm" disabled={page + 1 >= data.totalPages} onClick={() => setPage(page + 1)}>
              {t('common.nextPage')}
            </Button>
          </div>
        </nav>
      )}

      <ConfirmDialog
        open={toDelete !== null}
        title={t('common.delete')}
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
        tone="danger"
        onConfirm={() => void remove()}
        onCancel={() => setToDelete(null)}
      >
        {toDelete && t('users.deleteConfirm', { name: toDelete.fullName })}
      </ConfirmDialog>
    </>
  );
}

function UserEditor({ state, isSelf, onClose, onSaved }: { state: NonNullable<EditorState>; isSelf: boolean; onClose: () => void; onSaved: () => Promise<void> }) {
  const t = useT();
  const editing = state.mode === 'edit' ? state.user : null;
  const [form, setForm] = useState<Required<AdminUserPayload>>({
    fullName: editing?.fullName ?? '',
    email: editing?.email ?? '',
    password: '',
    role: editing?.role ?? 'STUDENT',
    active: editing?.active ?? true,
  });
  const [errors, setErrors] = useState<Partial<Record<'fullName' | 'email' | 'password', string>>>({});
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    const next: typeof errors = {};
    if (form.fullName.trim().length < 2) next.fullName = t('auth.nameShort');
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) next.email = t('auth.emailInvalid');
    if ((!editing || form.password) && form.password.length < 6) next.password = t('auth.passwordShort');
    setErrors(next);
    if (Object.keys(next).length) return;

    const payload: AdminUserPayload = {
      fullName: form.fullName.trim(),
      email: form.email.trim(),
      role: form.role,
      active: form.active,
      ...(form.password ? { password: form.password } : {}),
    };
    try {
      setSaving(true);
      if (editing) await updateUser(editing.id, payload);
      else await createUser(payload);
      toast.success(t('users.saved'));
      await onSaved();
    } catch (error) {
      toast.error(errorMessage(error, 'errors.save'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="mb-6 animate-rise rounded-card border border-accent/40 bg-surface p-5 shadow-lift sm:p-6" aria-label={editing ? t('users.editTitle', { name: editing.fullName }) : t('users.newTitle')}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="font-serif text-xl font-semibold">{editing ? t('users.editTitle', { name: editing.fullName }) : t('users.newTitle')}</h2>
        <button type="button" onClick={onClose} aria-label={t('common.close')} className="grid h-9 w-9 place-items-center rounded-control text-soft hover:bg-fg/[0.06] hover:text-fg">
          <X className="h-5 w-5" />
        </button>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label={t('common.fullName')} htmlFor="u-name" error={errors.fullName}>
          <Input id="u-name" value={form.fullName} onChange={(event) => setForm({ ...form, fullName: event.target.value })} aria-invalid={Boolean(errors.fullName)} />
        </Field>
        <Field label={t('common.email')} htmlFor="u-email" error={errors.email}>
          <Input id="u-email" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} aria-invalid={Boolean(errors.email)} />
        </Field>
        <Field label={t('common.password')} htmlFor="u-password" hint={editing ? t('users.passwordHint') : undefined} error={errors.password}>
          <Input
            id="u-password"
            type="password"
            autoComplete="new-password"
            value={form.password}
            onChange={(event) => setForm({ ...form, password: event.target.value })}
            aria-invalid={Boolean(errors.password)}
          />
        </Field>
        <Field label={t('common.role')} htmlFor="u-role">
          <Select id="u-role" value={form.role} disabled={isSelf} onChange={(event) => setForm({ ...form, role: event.target.value as UserRole })}>
            {ROLES.map((item) => (
              <option key={item} value={item}>
                {t(`roles.${item}`)}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-5">
        <label className={cn('inline-flex cursor-pointer items-center gap-3', isSelf && 'pointer-events-none opacity-50')}>
          <input type="checkbox" checked={form.active} disabled={isSelf} onChange={(event) => setForm({ ...form, active: event.target.checked })} className="peer sr-only" />
          <span className="relative h-6 w-11 rounded-full bg-fg/15 transition-colors peer-checked:bg-accent peer-focus-visible:ring-2 peer-focus-visible:ring-accent after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow after:transition-transform peer-checked:after:translate-x-5" />
          <span className="text-sm font-medium">{t('users.activeLabel')}</span>
        </label>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button onClick={() => void submit()} loading={saving}>
            {t('common.save')}
          </Button>
        </div>
      </div>
    </section>
  );
}
