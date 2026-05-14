import { useCallback, useEffect, useRef, useState } from 'react';
import { useAttachmentStore } from '@/store/attachmentStore';

interface FileUploaderProps {
  participationId: string;
  questionId: string;
}

export function FileUploader({ participationId, questionId }: FileUploaderProps) {
  const { attachments, loading, error, fetchAttachments, uploadFile, removeFile } =
    useAttachmentStore();
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    fetchAttachments(participationId, questionId);
  }, [participationId, questionId, fetchAttachments]);

  const handleFile = useCallback(
    async (file: File) => {
      if (file.size > 10 * 1024 * 1024) {
        alert('Файл слишком большой. Максимальный размер 10 MB.');
        return;
      }
      await uploadFile(participationId, questionId, file);
    },
    [participationId, questionId, uploadFile],
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      if (e.dataTransfer.files.length) {
        handleFile(e.dataTransfer.files[0]);
      }
    },
    [handleFile],
  );

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const onDragLeave = () => setDragOver(false);

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return '🖼️';
    if (mimeType === 'application/pdf') return '📄';
    if (mimeType.includes('word')) return '📝';
    if (mimeType.includes('excel')) return '📊';
    return '📎';
  };

  return (
    <div className="mt-4">
      <div
        className={`rounded-2xl border-2 border-dashed p-5 text-center transition ${
          dragOver
            ? 'border-[rgb(var(--primary))] bg-[rgba(var(--primary),0.06)]'
            : 'border-[rgb(var(--border))]'
        }`}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
      >
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept=".jpg,.jpeg,.png,.gif,.pdf,.doc,.docx,.xls,.xlsx"
          onChange={(e) => {
            if (e.target.files?.[0]) handleFile(e.target.files[0]);
            e.target.value = '';
          }}
        />
        <button
          type="button"
          className="text-sm font-semibold text-[rgb(var(--primary))] hover:underline"
          onClick={() => inputRef.current?.click()}
        >
          Загрузить файл
        </button>
        <p className="mt-1 text-xs text-[rgb(var(--text-soft))]">
          или перетащите сюда. Изображения, PDF, документы до 10 МБ
        </p>
      </div>

      {loading && (
        <p className="mt-2 text-sm text-[rgb(var(--text-soft))]">Загрузка...</p>
      )}
      {error && <p className="mt-2 text-sm text-red-500">{error}</p>}

      {attachments.length > 0 && (
        <ul className="mt-3 space-y-2">
          {attachments.map((att) => (
            <li
              key={att.id}
              className="flex items-center gap-3 rounded-2xl border border-[rgb(var(--border))] p-3"
            >
              <span className="text-xl">{getIcon(att.mimeType)}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{att.originalName}</p>
                <p className="text-xs text-[rgb(var(--text-soft))]">{formatSize(att.size)}</p>
              </div>
              <button
                type="button"
                className="text-sm text-red-500 hover:text-red-700"
                onClick={() => removeFile(att.id)}
                disabled={loading}
              >
                Удалить
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
