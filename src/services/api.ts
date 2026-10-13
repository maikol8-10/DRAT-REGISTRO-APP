import { env } from '@/config/env';
import type { Session } from '@/auth/SessionContext';

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

type Employee = { id: string; identification: string; name: string; department: string; position: string; active: boolean };
type InstitutionalVehicle = { id: string; plate: string; brand: string; model: string; year: number; fuelType: string; active: boolean; ownershipType: 'INSTITUCIONAL' };
type PrivateVehicle = { id: string; plate: string; brand: string; model: string; color: string; active: boolean; ownershipType: 'PARTICULAR'; owner: Pick<Employee, 'id' | 'identification' | 'name' | 'active'> };

async function apiRequest<T>(path: string, init: RequestInit = {}, token?: string): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body) headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);
  const response = await fetch(`${env.apiUrl}${path}`, { ...init, headers });
  const body = (await response.json()) as T & { error?: string };
  if (!response.ok) throw new Error(body.error ?? `La API respondió con estado ${response.status}`);
  return body;
}

export function login(email: string, password: string) {
  return apiRequest<Session>('/api/v1/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
}

export type CatalogResult =
  | { id: string; kind: 'FUNCIONARIO'; title: string; identifier: string; detail: string }
  | { id: string; kind: 'INSTITUCIONAL'; title: string; identifier: string; detail: string }
  | { id: string; kind: 'PARTICULAR'; title: string; identifier: string; detail: string };

export async function searchCatalogs(token: string, search: string): Promise<CatalogResult[]> {
  const query = `?search=${encodeURIComponent(search.trim())}`;
  const [employees, institutional, privateVehicles] = await Promise.all([
    apiRequest<{ data: Employee[] }>(`/api/v1/catalogs/employees${query}`, {}, token),
    apiRequest<{ data: InstitutionalVehicle[] }>(`/api/v1/catalogs/institutional-vehicles${query}`, {}, token),
    apiRequest<{ data: PrivateVehicle[] }>(`/api/v1/catalogs/private-vehicles${query}`, {}, token),
  ]);
  return [
    ...employees.data.filter((item) => item.active).map((item): CatalogResult => ({ id: item.id, kind: 'FUNCIONARIO', title: item.name, identifier: item.identification, detail: `${item.department} · ${item.position}` })),
    ...institutional.data.filter((item) => item.active).map((item): CatalogResult => ({ id: item.id, kind: 'INSTITUCIONAL', title: `${item.brand} ${item.model}`, identifier: item.plate, detail: `${item.year} · ${item.fuelType}` })),
    ...privateVehicles.data.filter((item) => item.active && item.owner?.active).map((item): CatalogResult => ({ id: item.id, kind: 'PARTICULAR', title: `${item.brand} ${item.model}`, identifier: item.plate, detail: `Propietario: ${item.owner.name} · ${item.owner.identification}` })),
  ];
}

export type NfcMovementResolution = {
  tag: { id: string; code: string };
  employee: Employee;
  proposedMovement: 'INGRESO' | 'SALIDA';
  lastMovement: { movementType: 'INGRESO' | 'SALIDA'; occurredAt: string } | null;
};

export async function resolveNfcMovement(token: string, code: string) {
  const response = await apiRequest<{ data: NfcMovementResolution }>('/api/v1/movements/employees/nfc/resolve', { method: 'POST', body: JSON.stringify({ code }) }, token);
  return response.data;
}

export async function confirmNfcMovement(token: string, code: string, movementType: 'INGRESO' | 'SALIDA') {
  const response = await apiRequest<{ data: { id: string; movementType: 'INGRESO' | 'SALIDA'; occurredAt: string } }>('/api/v1/movements/employees/nfc', { method: 'POST', body: JSON.stringify({ code, movementType, source: 'NFC_SIMULADO' }) }, token);
  return response.data;
}
