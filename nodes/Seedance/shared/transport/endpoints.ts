import { SEEDANCE_API_VERSION } from '../constants';
import type { SeedanceOperationKey } from '../types';

export const SEEDANCE_TASK_CREATE_ENDPOINT = `/api/v3/contents/generations/tasks`;

export const SEEDANCE_TASK_GET_ENDPOINT = `/api/v3/contents/generations/tasks/{id}`;

const operationEndpoints: Record<SeedanceOperationKey, string> = {
  createTask: SEEDANCE_TASK_CREATE_ENDPOINT,
  getTask: SEEDANCE_TASK_GET_ENDPOINT,
};

export function normalizeSeedancePath(path: string): string {
  const trimmedPath = path.trim();

  if (trimmedPath === '') {
    return '/';
  }

  return trimmedPath.startsWith('/') ? trimmedPath : `/${trimmedPath}`;
}

export function getSeedanceOperationEndpoint(operation: SeedanceOperationKey): string {
  return operationEndpoints[operation];
}

export function buildSeedanceEndpointUrl(path: string, baseUrl: string): string {
  return `${baseUrl.replace(/\/$/, '')}${normalizeSeedancePath(path)}`;
}

export function getSeedanceApiVersion(): string {
  return SEEDANCE_API_VERSION;
}
