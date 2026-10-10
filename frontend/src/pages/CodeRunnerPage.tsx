import { useState } from 'react';
import { useT } from '@/i18n';
import { CodeEditor } from '@/components/domain/CodeEditor';
import { Field, Textarea } from '@/components/ui/Field';
import { PageHeader } from '@/components/ui/PageHeader';

const SAMPLE = `n = int(input())
a, b = 0, 1
for _ in range(n):
    a, b = b, a + b
print(a)
`;

export function CodeRunnerPage() {
  const t = useT();
  const [code, setCode] = useState(SAMPLE);
  const [stdin, setStdin] = useState('10');

  return (
    <>
      <PageHeader title={t('code.title')} lead={t('code.lead')} />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <CodeEditor value={code} onChange={setCode} stdin={stdin} minRows={18} emptyOutputHint={t('code.outputEmpty')} />
        <div className="space-y-4">
          <Field label={t('code.stdin')} htmlFor="stdin" hint={t('code.stdinPlaceholder')}>
            <Textarea id="stdin" rows={6} value={stdin} onChange={(event) => setStdin(event.target.value)} className="font-mono text-[13px]" />
          </Field>
        </div>
      </div>
    </>
  );
}
