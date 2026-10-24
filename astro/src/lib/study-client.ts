const base = import.meta.env.BASE_URL.replace(/\/$/, '') + '/api/';

export async function studyRequest<T = { saved: boolean }>(route: string, data?: unknown): Promise<T> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetch(base + route, {
      method: data === undefined ? 'GET' : 'POST',
      headers: data === undefined ? {} : { 'Content-Type': 'application/json' },
      body: data === undefined ? undefined : JSON.stringify(data),
      signal: controller.signal,
    });
    if (!response.ok) throw new Error('Não foi possível salvar no banco pessoal.');
    return await response.json();
  } finally { window.clearTimeout(timeout); }
}

export const offlineMessage = 'Para salvar seu estudo, abra a versão pessoal no computador. A leitura e os gabaritos continuam disponíveis.';

export interface LessonState {
  progress: { status: 'in_progress' | 'completed'; last_section: string } | null;
  note: string;
  flags: number[];
}
