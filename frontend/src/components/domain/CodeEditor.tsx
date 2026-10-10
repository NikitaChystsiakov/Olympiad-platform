import { Play } from 'lucide-react';
import { useState, type KeyboardEvent } from 'react';
import { runCode, type RunCodeResult } from '@/api/code';
import { errorMessage } from '@/api/http';
import { useT } from '@/i18n';
import { cn } from '@/utils/cn';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Field';

const CODE_LANGUAGES = [
  { id: 71, label: 'Python 3' },
  { id: 63, label: 'JavaScript (Node.js)' },
  { id: 62, label: 'Java' },
  { id: 54, label: 'C++ (GCC)' },
];

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  stdin?: string;
  minRows?: number;
  /** Shown in the output area before the first run; without it the area stays hidden until then. */
  emptyOutputHint?: string;
  className?: string;
}

/** Plain textarea editor with Tab indentation and a Judge0 run panel. */
export function CodeEditor({ value, onChange, stdin, minRows = 12, emptyOutputHint, className }: CodeEditorProps) {
  const t = useT();
  const [languageId, setLanguageId] = useState(CODE_LANGUAGES[0].id);
  const [result, setResult] = useState<RunCodeResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);

  const lines = Math.max(minRows, value.split('\n').length + 1);

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== 'Tab' || event.shiftKey) return;
    event.preventDefault();
    const target = event.currentTarget;
    const { selectionStart, selectionEnd } = target;
    const next = `${value.slice(0, selectionStart)}    ${value.slice(selectionEnd)}`;
    onChange(next);
    requestAnimationFrame(() => target.setSelectionRange(selectionStart + 4, selectionStart + 4));
  };

  const run = async () => {
    if (!value.trim()) return;
    try {
      setRunning(true);
      setError(null);
      setResult(await runCode({ sourceCode: value, languageId, stdin }));
    } catch (err) {
      setResult(null);
      setError(errorMessage(err, 'code.failed'));
    } finally {
      setRunning(false);
    }
  };

  const failed = result && result.statusId !== undefined && result.statusId !== 3;

  return (
    <div className={cn('overflow-hidden rounded-chip border border-line bg-[#14181A]', className)}>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 px-3 py-2">
        <label className="flex items-center gap-2 text-[13px] text-white/60">
          <span>{t('attempt.codeLanguage')}</span>
          <Select
            value={languageId}
            onChange={(event) => setLanguageId(Number(event.target.value))}
            className="h-8 w-auto border-white/10 bg-white/5 py-0 text-[13px] text-white"
          >
            {CODE_LANGUAGES.map((language) => (
              <option key={language.id} value={language.id}>
                {language.label}
              </option>
            ))}
          </Select>
        </label>
        <Button size="sm" onClick={() => void run()} loading={running} disabled={!value.trim()}>
          {!running && <Play className="h-3.5 w-3.5" />}
          {running ? t('attempt.codeRunning') : t('attempt.codeRun')}
        </Button>
      </div>

      <div className="flex">
        <div aria-hidden className="select-none border-r border-white/5 py-3 pl-3 pr-2 text-right font-mono text-[13px] leading-[1.7] text-white/25">
          {Array.from({ length: lines }, (_, index) => (
            <div key={index}>{index + 1}</div>
          ))}
        </div>
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={handleKeyDown}
          spellCheck={false}
          rows={lines}
          placeholder={t('attempt.codePlaceholder')}
          aria-label={t('attempt.codePlaceholder')}
          className="min-w-0 flex-1 resize-none bg-transparent px-3 py-3 font-mono text-[13px] leading-[1.7] text-[#E6E6E1] caret-marker placeholder:text-white/25 focus:outline-none"
        />
      </div>

      {(result || error || emptyOutputHint) && (
        <div className="border-t border-white/10 px-4 py-3 font-mono text-[13px] text-white/85" aria-live="polite">
          {!result && !error ? (
            <p className="font-sans text-white/40">{emptyOutputHint}</p>
          ) : error ? (
            <p className="text-[#FF8A80]">{error}</p>
          ) : (
            result && (
              <>
                <p className="flex flex-wrap gap-x-4 gap-y-1 text-white/55">
                  <span className={cn('font-semibold', failed ? 'text-[#FF8A80]' : 'text-[#7FD1AE]')}>{result.status ?? '—'}</span>
                  {result.time && <span>{result.time} s</span>}
                  {result.memory != null && <span>{result.memory} KB</span>}
                </p>
                {result.stdout && <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap">{result.stdout}</pre>}
                {result.stderr && <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap text-[#FF8A80]">{result.stderr}</pre>}
                {result.compileOutput && <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap text-[#F2B65A]">{result.compileOutput}</pre>}
              </>
            )
          )}
        </div>
      )}
    </div>
  );
}
