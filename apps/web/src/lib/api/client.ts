import { resolvePublicApiUrl } from '../routing/public-surface';

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

function getShowcaseRequestHeaders(): Record<string, string> {
  // The full product tagged requests originating from the embedded landing-page
  // demo. The open core has no demo surface, so no extra headers are added.
  return {};
}

export class ApiClient {
  private configuredBaseUrl: string;
  private accessToken?: string;
  private onTokenRefresh?: (tokens: { accessToken: string }) => void;

  constructor(config: {
    baseUrl?: string;
    onTokenRefresh?: (tokens: { accessToken: string }) => void;
  }) {
    this.configuredBaseUrl =
      config.baseUrl || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/v1';
    this.onTokenRefresh = config.onTokenRefresh;
  }

  private getBaseUrl(): string {
    if (typeof window !== 'undefined') {
      return resolvePublicApiUrl(window.location.hostname, this.configuredBaseUrl);
    }

    return this.configuredBaseUrl;
  }

  setTokens(tokens: { accessToken: string }) {
    this.accessToken = tokens.accessToken;
  }

  clearTokens() {
    this.accessToken = undefined;
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.getBaseUrl()}${path}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...getShowcaseRequestHeaders(),
      ...(options.headers as Record<string, string>),
    };

    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        credentials: 'include', // Send cookies for refresh token
      });

      const data = await response.json();

      if (!response.ok) {
        throw new ApiError(
          response.status,
          data.error?.code || 'UNKNOWN_ERROR',
          data.error?.message || 'An error occurred',
          data.error?.details
        );
      }

      // Unwrap {success: true, data: T} envelope, but preserve paginated
      // responses like {data: [], total: 0, page: 1, limit: 25} as-is
      if (data.success !== undefined && data.data !== undefined) {
        return data.data;
      }
      return data;
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 401) {
          try {
            const tokens = await this.refreshTokens();
            this.accessToken = tokens.accessToken;
            this.onTokenRefresh?.(tokens);

            return this.request<T>(path, options);
          } catch (refreshError) {
            this.clearTokens();
            throw refreshError;
          }
        }
        throw error;
      }
      throw new ApiError(0, 'NETWORK_ERROR', 'Network error occurred');
    }
  }

  private async refreshTokens(): Promise<{ accessToken: string; expiresIn: number }> {
    const response = await fetch(`${this.getBaseUrl()}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Cookie carries the refresh token
      body: JSON.stringify({}),
    });

    if (!response.ok) {
      throw new ApiError(response.status, 'REFRESH_FAILED', 'Failed to refresh token');
    }

    const data = await response.json();
    return data.data?.tokens || data.tokens;
  }

  async get<T>(path: string, params?: Record<string, unknown>): Promise<T> {
    let queryString = '';
    if (params) {
      const filtered: Record<string, string> = {};
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null) {
          filtered[key] = String(value);
        }
      }
      const qs = new URLSearchParams(filtered).toString();
      if (qs) queryString = '?' + qs;
    }
    return this.request<T>(`${path}${queryString}`, { method: 'GET' });
  }

  async post<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>(path, {
      method: 'POST',
      body: JSON.stringify(body ?? {}),
    });
  }

  async patch<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>(path, {
      method: 'PATCH',
      body: JSON.stringify(body ?? {}),
    });
  }

  async put<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>(path, {
      method: 'PUT',
      body: JSON.stringify(body ?? {}),
    });
  }

  async delete<T>(path: string): Promise<T> {
    return this.request<T>(path, { method: 'DELETE' });
  }
}

export const apiClient = new ApiClient({
  onTokenRefresh: (tokens) => {
    import('../hooks/use-auth').then(({ useAuth }) => {
      useAuth.setState({ token: tokens.accessToken });
    });
  },
});
