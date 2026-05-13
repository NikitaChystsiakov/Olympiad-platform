import { useState } from 'react';
import { toast } from 'sonner';
import { runCode, type RunCodeResult } from '@/api/code';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';

const languages = [
  { id: 63, label: 'JavaScript (Node.js)' },
  { id: 62, label: 'Java' },
  { id: 71, label: 'Python' },
  { id: 54, label: 'C++' },
];

export function CodeRunnerPage() {
  const [languageId, setLanguageId] = useState(63);
  const [sourceCode, setSourceCode] = useState('console.log("Hello, Olympiad!");');
  const [stdin, setStdin] = useState('');
  const [result, setResult] = useState<RunCodeResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const handleRun = async () => {
    try {
      setIsRunning(true);
      setResult(null);
      const nextResult = await runCode({ sourceCode, languageId, stdin });
      setResult(nextResult);
    } catch {
      toast.error('Не удалось выполнить код через Judge0');
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
      <Card className="rounded-[28px] p-6">
        <p className="text-sm uppercase tracking-[0.18em] text-[rgb(var(--primary))]">Judge0 API</p>
        <h1 className="mt-2 text-3xl font-extrabold">Проверка кода</h1>
        <div className="mt-6 space-y-4">
          <div>
            <label className="mb-2 block text-sm font-semibold">Язык</label>
            <Select value={languageId} onChange={(event) => setLanguageId(Number(event.target.value))}>
              {languages.map((language) => (
                <option key={language.id} value={language.id}>
                  {language.label}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold">Код</label>
            <Textarea value={sourceCode} onChange={(event) => setSourceCode(event.target.value)} className="min-h-[320px] font-mono" />
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold">stdin</label>
            <Textarea value={stdin} onChange={(event) => setStdin(event.target.value)} />
          </div>
          <Button onClick={() => void handleRun()} disabled={isRunning || !sourceCode.trim()}>
            {isRunning ? 'Выполняем...' : 'Запустить'}
          </Button>
        </div>
      </Card>

      <Card className="h-fit rounded-[28px] p-6">
        <h2 className="text-2xl font-extrabold">Результат</h2>
        {!result ? (
          <p className="mt-4 text-sm text-[rgb(var(--text-soft))]">Результат появится после запуска кода.</p>
        ) : (
          <div className="mt-4 space-y-4 text-sm">
            <Info label="Статус" value={result.status ?? '-'} />
            <Info label="Время" value={result.time ?? '-'} />
            <Info label="Память" value={result.memory == null ? '-' : `${result.memory} KB`} />
            <Output label="stdout" value={result.stdout} />
            <Output label="stderr" value={result.stderr} />
            <Output label="compile output" value={result.compileOutput} />
          </div>
        )}
      </Card>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.14em] text-[rgb(var(--text-soft))]">{label}</p>
      <p className="mt-1 font-semibold">{value}</p>
    </div>
  );
}

function Output({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.14em] text-[rgb(var(--text-soft))]">{label}</p>
      <pre className="mt-2 max-h-52 overflow-auto rounded-xl bg-[rgba(var(--surface-muted),0.75)] p-3 whitespace-pre-wrap">
        {value || '-'}
      </pre>
    </div>
  );
}
