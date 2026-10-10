import { FileText, Image as ImageIcon, Paperclip, Trash2, Upload } from 'lucide-react';
import { useEffect, useRef, useState, type DragEvent } from 'react';
import { deleteAttachment, downloadAttachment, fetchAttachments, uploadAttachment } from '@/api/attachments';
import { errorMessage } from '@/api/http';
import { useT } from '@/i18n';
import type { FileAttachment } from '@/types';
import { cn } from '@/utils/cn';
import { formatFileSize } from '@/utils/format';
import { Spinner } from '@/components/ui/Spinner';

const MAX_SIZE = 10 * 1024 * 1024;

export function FileIcon({ mimeType, className }: { mimeType: string; className?: string }) {
  const Icon = mimeType.startsWith('image/') ? ImageIcon : mimeType === 'application/pdf' || mimeType.includes('word') ? FileText : Paperclip;
  return <Icon className={cn('h-4 w-4 shrink-0', className)} />;
}

export function FileUploader({ participationId, questionId }: { participationId: string; questionId: string }) {
  const t = useT();
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<FileAttachment[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchAttachments(participationId, questionId)
      .then((list) => !cancelled && setFiles(list))
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [participationId, questionId]);

  const upload = async (file: File) => {
    if (file.size > MAX_SIZE) {
      setError(t('attempt.tooLarge'));
      return;
    }
    try {
      setBusy(true);
      setError(null);
      const saved = await uploadAttachment(participationId, questionId, file);
      setFiles((current) => [...current, saved]);
    } catch (err) {
      setError(errorMessage(err, 'attempt.uploadFailed'));
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    try {
      setBusy(true);
      await deleteAttachment(id);
      setFiles((current) => current.filter((file) => file.id !== id));
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const onDrop = (event: DragEvent) => {
    event.preventDefault();
    setDragOver(false);
    const file = event.dataTransfer.files[0];
    if (file) void upload(file);
  };

  return (
    <div>
      <p className="mb-2 text-[13px] font-semibold">{t('attempt.files')}</p>
      <div
        onDragOver={(event) => {
          event.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={cn(
          'flex flex-wrap items-center gap-3 rounded-chip border border-dashed px-4 py-3 transition-colors',
          dragOver ? 'border-accent bg-accent-soft' : 'border-line',
        )}
      >
        <input
          ref={inputRef}
          type="file"
          className="sr-only"
          accept=".jpg,.jpeg,.png,.gif,.pdf,.doc,.docx,.xls,.xlsx"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void upload(file);
            event.target.value = '';
          }}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="inline-flex h-9 items-center gap-2 rounded-control border border-line bg-surface px-3 text-sm font-semibold transition-colors hover:bg-muted disabled:opacity-60"
        >
          {busy ? <Spinner /> : <Upload className="h-4 w-4" />}
          {t('attempt.upload')}
        </button>
        <span className="text-[13px] text-soft">{t('attempt.dropHint')}</span>
      </div>
      {error && <p role="alert" className="mt-2 text-[13px] font-medium text-risk-high">{error}</p>}
      {files.length > 0 && (
        <ul className="mt-2 space-y-1.5">
          {files.map((file) => (
            <li key={file.id} className="flex items-center gap-3 rounded-control bg-muted px-3 py-2 text-sm">
              <FileIcon mimeType={file.mimeType} className="text-soft" />
              <button type="button" onClick={() => void downloadAttachment(file)} className="min-w-0 flex-1 truncate text-left font-medium hover:underline">
                {file.originalName}
              </button>
              <span className="num text-xs text-soft">{formatFileSize(file.size)}</span>
              <button
                type="button"
                onClick={() => void remove(file.id)}
                disabled={busy}
                aria-label={t('common.delete')}
                className="grid h-7 w-7 place-items-center rounded-[7px] text-soft hover:bg-risk-high-bg hover:text-risk-high"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
