import { env } from '@/config/env';

interface ApiHealth {
  status: 'ok';
  service: string;
  timestamp: string;
}

export async function getApiHealth(signal?: AbortSignal): Promise<ApiHealth> {
  const response = await fetch(`${env.apiUrl}/health`, { signal });
  if (!response.ok) {
    throw new Error(`La API respondió con estado ${response.status}`);
  }
  return response.json() as Promise<ApiHealth>;
}
