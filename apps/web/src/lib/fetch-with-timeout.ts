import { API_CONSTANTS } from './constants';

const DEFAULT_TIMEOUT_MS = API_CONSTANTS.DEFAULT_TIMEOUT_MS;

export function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs = DEFAULT_TIMEOUT_MS
): Promise<Response> {
  const controller = new AbortController();

  // If caller provides a signal (e.g., for abort-on-unmount), propagate it
  if (options.signal) {
    options.signal.addEventListener('abort', () => controller.abort());
  }

  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  return fetch(url, { ...options, signal: controller.signal }).finally(() => {
    clearTimeout(timeoutId);
  });
}
