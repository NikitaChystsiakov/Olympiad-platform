import { http } from './http';

export interface RunCodePayload {
  sourceCode: string;
  languageId: number;
  stdin?: string;
}

export interface RunCodeResult {
  stdout?: string;
  stderr?: string;
  compileOutput?: string;
  message?: string;
  status?: string;
  statusId?: number;
  time?: string;
  memory?: number;
}

export async function runCode(payload: RunCodePayload) {
  const { data } = await http.post<RunCodeResult>('/code/run', payload);
  return data;
}
